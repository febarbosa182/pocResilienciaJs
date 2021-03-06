var express = require('express'),
    Promise = require('q'),
    getRandomInt = require('./random_int'),
    hystrixStream = require('hystrixjs').hystrixSSEStream,
    CommandsFactory = CommandsFactory = require('hystrixjs').commandFactory,
    rest = require('rest'),
    consulId = require('uuid').v4(),
    consul = require('consul')({
        host:'consul'
    });

const CLSContext = require('zipkin-context-cls'),
      {Tracer} = require('zipkin'),
      {recorder} = require('./recorder'),
      recorderKafka = require('./recorderKafka'),
      ctxImpl = new CLSContext('zipkin');

if (!process.env.ZIPKIN_TRANSPORTER){
    tracer = new Tracer({ ctxImpl , recorder });
}else
if (process.env.ZIPKIN_TRANSPORTER=="KAFKA"){
    tracer = new Tracer({ ctxImpl , recorder: recorderKafka.recorderKafka });
}else{
    tracer = new Tracer({ ctxImpl , recorder });
}

//var to instrument the zipkin server           
var zipKinMidleware = require('zipkin-instrumentation-express').expressMiddleware;

// instrument the client
const {restInterceptor} = require('zipkin-instrumentation-cujojs-rest');

function hystrixStreamResponse(request, response) {
    response.append('Content-Type', 'text/event-stream;charset=UTF-8');
    response.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    response.append('Pragma', 'no-cache');
    return hystrixStream.toObservable().subscribe(
        function onNext(sseData) {
            response.write('data: ' + sseData + '\n\n');
        },
        function onError(error) {console.log(error);
        },
        function onComplete() {
            return response.end();
        }
    );

};

module.exports = function(port) {
    var app = express(),
        cbs = [],
        commands = [],
        reqs = 0,
        commandsFall = null;

    consulId = 'app' + port + consulId;

    let details = {
        name: 'apps'+ port,
        address: 'localhost',
        port: port,
        id: consulId,
        check: {
            ttl: '10s',
            deregister_critical_service_after: '1m'
        }
    };

    consul.agent.service.register(details, err => {
        if (err) throw new Error(err);
        console.log('registered with Consul');

        setInterval(() => {
            consul.agent.check.pass({id:`service:${consulId}`}, err => {
                if (err) throw new Error(err);
                console.log('App ' + port + 'told Consul that we are healthy');
            });
        }, 5 * 1000);
    });

        
    var isErrorHandler = function(error) {
        if (error) {
            return error;
        }
        if (error.statusCode == 503) {
            var unavailableError = new Error();
            unavailableError.name = "ServiceUnavailableError";
            return unavailableError;
        }
        return null;
    };

    const zipkinRest = rest.wrap(
        restInterceptor, 
        {
            tracer, serviceName: 'app' + port
        }
    );

    var makeRequest = function(options) {
        return zipkinRest(options.url);
    };

    var fallBackService = function() {
        //service de fallback
        commandsFall.execute({
            method: "GET" ,
            url : "http://localhost:3006/random-sleep/1"
        });
    };

    this.configure = function(config) {

        config.services.forEach(function(service) {
            var serviceCommand = CommandsFactory.getOrCreate("Service on port :" + service.port + ":" + port)
                .circuitBreakerErrorThresholdPercentage(service.errorThreshold)
                .timeout(service.timeout)
                .run(makeRequest)
                .circuitBreakerRequestVolumeThreshold(service.concurrency)
                .circuitBreakerSleepWindowInMilliseconds(service.timeout)
                .statisticalWindowLength(10000)
                .statisticalWindowNumberOfBuckets(10)
                .errorHandler(isErrorHandler)
                .fallbackTo(fallBackService)
                .build();
            serviceCommand.service = service;
            commands.push(serviceCommand);
        });
    };

    this.fallBackConfigure = function(fallBackConfig) {
        var serviceCommand = CommandsFactory.getOrCreate("Service on port :" + fallBackConfig.port + ":" + port)
                .circuitBreakerErrorThresholdPercentage(fallBackConfig.errorThreshold)
                .timeout(fallBackConfig.timeout)
                .run(makeRequest)
                .circuitBreakerRequestVolumeThreshold(fallBackConfig.concurrency)
                .circuitBreakerSleepWindowInMilliseconds(fallBackConfig.timeout)
                .statisticalWindowLength(10000)
                .statisticalWindowNumberOfBuckets(10)
                .errorHandler(isErrorHandler)
                .build();
        serviceCommand.service = fallBackConfig;
        serviceCommand.service.port = fallBackConfig.port;
        commandsFall = serviceCommand;
    };

    //instrument the server
    app.use(
        zipKinMidleware({
            tracer,
            serviceName: 'app' + port
        })
    );

    // Allow cross-origin, traced requests. See http://enable-cors.org/server_expressjs.html
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', [
            'Origin', 'Accept', 'X-Requested-With', 'X-B3-TraceId',
            'X-B3-ParentSpanId', 'X-B3-SpanId', 'X-B3-Sampled'
        ].join(', '));
        next();
    });

    app.get('/api/hystrix.stream', hystrixStreamResponse);

    app.get('/deregister', function(){
        consul.agent.service.deregister(details, (err) => {
            console.log('de-registered app.', err);
        });
    });

    app.get("/", function(req, res) {
        var promises = [];
        commands.forEach(function(command) {
            var n = getRandomInt(1, command.service.calls);
            for (var i = 0; i < n; i++) {
                var url = "http://localhost:" + command.service.port + "/random-sleep/" + command.service.sleep;
                promises.push(command.execute(
                    {
                        method: "GET" ,
                        url : url
                    }
                ));
            }
        }); 

        Promise.all(promises).then(function(results) {
           results.forEach(function(result) {
               res.send(results.join("\n"));
               res.set('Content-Type', 'text/plain');
               reqs++;
           });
        }).catch(function(error) {
            reqs++;
            res.send("Error: " + error);
        });
    });

    this.start = function() {
        process.title = 'node (app:' + port + ')';
        app.listen(port, function() {
            var start = Date.now();
            console.log("[%d] APP Listening on %d", process.pid, port);
            setInterval(function() {
                var elapsed = (Date.now() - start) / 1000;
                var rps = elapsed ? reqs / elapsed : 0;
                console.log("App req/s: " + rps);
            }, 3000);
        });
    };

};
