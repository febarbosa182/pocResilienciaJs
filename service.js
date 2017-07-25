var express = require('express'),
    getRandomInt = require('./random_int'),
    consulId = require('uuid').v4(),
    consul = require('consul')({
        host:'consul'
    });

const CLSContext = require('zipkin-context-cls'),
      {Tracer} = require('zipkin'),
      {recorder} = require('./recorder'),
      ctxImpl = new CLSContext('zipkin'),
      recorderKafka = require('./recorderKafka'),
      //tracer = new Tracer({ctxImpl,recorder}),
      zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

var tracer = null;

if (!process.env.ZIPKIN_TRANSPORTER){
    tracer = new Tracer({ ctxImpl , recorder });
}else
if (process.env.ZIPKIN_TRANSPORTER=="KAFKA"){
    tracer = new Tracer({ ctxImpl , recorder: recorderKafka.recorderKafka });
}else{
    tracer = new Tracer({ ctxImpl , recorder });
}

module.exports = function(port) {
    var app = express(),
        reqs = 0,
        sickPercentage = 5,
        maxSetSickTimeout = 5,
        sick = false,
        maintenancePercentage = 50,
        maxSetMaintenanceTimeout = 50,
        maintenance = false;
    
    consulId = 'service' + port + consulId;

    let details = {
        name: 'service'+ port,
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
            console.log('Service ' + port + 'told Consul that we are healthy');
        });
        }, 5 * 1000);
    });

    function setSick() {
        sick = getRandomInt(0, 100) <= sickPercentage;
        //console.log("SERVICE: ", port, "sick", sick);
        setTimeout(setSick, 1000 * getRandomInt(0, maxSetSickTimeout));
    }

    function setMaintenance() {
        maintenance = getRandomInt(0, 100) <= maintenancePercentage;
        //console.log("SERVICE: ", port, "maintenance", maintenance);
        setTimeout(setMaintenance, 1000 * getRandomInt(0, maxSetMaintenanceTimeout));
    }

    setSick();
    setMaintenance();

    //instrument the server
    app.use(
        zipkinMiddleware({
            tracer,
            serviceName: 'service' + port
        })
    );

    app.get("/random-sleep/:ms", function(req, res) {
        reqs++;
        
        //simula um serviço em manutenção
        if (maintenance) {
            res.status(503).send("Temporaly Unavailable");
            return;
        }

        var ms;

        //simula um servidor com alta no tempo de retorno
        if (sick) {
            ms = getRandomInt(0, 10 * parseInt(req.params.ms));
        } else {
            ms = getRandomInt(0, parseInt(req.params.ms));
        }
        setTimeout(function() {
            res.send("OK: slept " + ms + " ms");
        }, ms);
    });

    app.get('/deregister', function(){
        consul.agent.service.deregister(details, (err) => {
            console.log('de-registered app.', err);
        });
    });

    this.start = function() {
        process.title = 'node (service:' + port + ')';
        app.listen(port, function() {
            var start = Date.now();
            console.log("[%d] SERVICE Listening on %d", process.pid, port);
            setInterval(function() {
                var elapsed = (Date.now() - start) / 1000;
                var rps = elapsed ? reqs / elapsed : 0;
                process.send({rps: rps});
            }, 1000);
        });
    };
};
