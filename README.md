# pocResilienciaJs
Projeto implementando hystrix, zipkin e consul em node.js

Os serviços, aplicações e dashboard ficam expostos nas seguintes portas: 
Serviços: 3001,3002,3003,3006(FallBack)
Aplicações: 3004, 3005
Hystrix Dashboard: 8000
Zipkin: 9411
Consul: 8500

Para subir os serviços e aplicações da poc:

```Batchfile
docker-compose build

docker-compose up
```

Os serviços e aplicações estão configurados para apresentarem latência e indisponibilidade por parâmetros.

<h1>
    <b>Hystrix</b>
</h1>

<b>Circuit breaker</b>

npm install --save hystrixjs

A biblioteca hystrixjs proporciona a implementação do seguinte fluxo.

![Alt text](./img/README/2583105901.png?raw=true "HystrixFlow")

Para a implementação do circuit braker:

```javascript
var CommandsFactory = require('hystrixjs').commandFactory;
var serviceCommand = CommandsFactory.getOrCreate("Service on port :" + service.port + ":" + port)
    .circuitBreakerErrorThresholdPercentage(service.errorThreshold)
    .timeout(service.timeout)
    .run(makeRequest)
    .circuitBreakerRequestVolumeThreshold(service.concurrency)
    .circuitBreakerSleepWindowInMilliseconds(service.timeout)
    .statisticalWindowLength(10000)
    .statisticalWindowNumberOfBuckets(10)
    .errorHandler(isErrorHandler)
    .fallbackTo(fallBackFunction)
    .build();

serviceCommand.execute({
    url: 'http://...'
})

var fallBackFunction = function() {
    //do stuff
};

var makeRequest = function(req) {
    //do stuff
    return request(req.url);
};

var isErrorHandler = function(error) {
    //develop error handlers  or use default
    return error;
};

```

<b>Stream de informações do circuit breaker</b>

Para a implementação do stream:

É necessario a biblioteca rxjs:

```Batchfile
npm install --save rxjs
```

Implementação na aplicação:

```javascript
var express = require('express'),
    app = express(),
    hystrixStream = require('hystrixjs').hystrixSSEStream;

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

app.get('/api/hystrix.stream', hystrixStreamResponse);
```

<b>Hystrix Dashboard</b>

```javascript
const express = require('express'),
      app = express(),
      dashboard = require('hystrix-dashboard');

app.use(dashboard({
    idleTimeout: 4000,  // will emit "ping if no data comes within 4 seconds,
    interval: 2000      // interval to collect metrics
    proxy: true         // enable proxy for stream
}));

app.listen(8000); //  http://localhost:8000/
```

Para iniciar o monitoramento via dashboard do funcionamento das aplicações e sua reciliência, deve adicionar o stream configurado em cada aplicação ao dashboard, no caso deste POC são os seguintes:

http://localhost:3004/api/hystrix.stream

http://localhost:3005/api/hystrix.stream

Exemplo: 
![Alt text](./img/README/2F8cCD.jpg?raw=true "Hystrix")

![Alt text](./img/README/DJEMtp.jpg?raw=true "HystrixStream1")

![Alt text](./img/README/ZA6i1q.jpg?raw=true "HystrixStream2")

https://www.npmjs.com/package/hystrix-dashboard

<h1>
    <b>Zipkin</b>
</h1>

Zipkin é um sistema de tracing, que pode ser implementado de diferentes formas dependendo da arquitetura de seu sistema.

<b>Implementação na aplicação</b>

```Batchfile
npm install --save zipkin
npm install --save zipkin-instrumentation-cujojs-rest
```

```javascript
const CLSContext = require('zipkin-context-cls'),
      {Tracer} = require('zipkin'),
      {recorder} = require('./recorder'),
      ctxImpl = new CLSContext('zipkin'),
      tracer = new Tracer({ctxImpl, recorder}),
      rest = require('rest');
      
      

//var to instrument the zipkin server           
var zipKinMidleware = require('zipkin-instrumentation-express').expressMiddleware;

//instrument the server
app.use(
    zipKinMidleware({
        tracer,
        serviceName: 'app' + port
    })
);

// instrument the client
const {restInterceptor} = require('zipkin-instrumentation-cujojs-rest');

const zipkinRest = rest.wrap(
    restInterceptor, 
    {
        tracer, 
        serviceName: 'xpto'
    }
);

//
var makeRequest = function(url){
    return zipkinRest(url);
};
```

Traces
![Alt text](./img/README/vXx02Q.jpg?raw=true "ZipkinTraces")

Dependências
![Alt text](./img/README/DJdkLG.jpg?raw=true "ZipkinDependences")

https://www.npmjs.com/package/zipkin
https://github.com/openzipkin/zipkin-js

<h1>
    <b>Consul</b>
</h1>

```Batchfile
npm install --save consul
```

```javascript
const consulId = require('uuid').v4(),
      consul = require('consul')({
          host:'consulHost', //default 127.0.0.1
          port:'consulPort'  //default 8500
      });

let details = {
    name: 'appName',
    address: 'appHost',
    port: appPort,
    id: consulId,
    check: {
        ttl: '10s', //check interval
        deregister_critical_service_after: '1m' //Time to deregister service if not health check 
    }
};
```

consul server UI
![Alt text](./img/README/v0niOX.jpg?raw=true "Consul")


https://www.npmjs.com/package/consul






