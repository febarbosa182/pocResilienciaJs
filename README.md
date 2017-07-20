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

app.listen(8000); //  http://localhost:8000/hystrix
```

Para iniciar o monitoramento via dashboard do funcionamento das aplicações e sua reciliência adicionar o stream de log de cada aplicação ao dashboard:

http://localhost:3004/api/hystrix.stream

http://localhost:3005/api/hystrix.stream

Exemplo: 
![Alt text](./img/README/2F8cCD.jpg?raw=true "Hystrix")

https://www.npmjs.com/package/hystrix-dashboard

<b>Zipkin</b>

Zipkin é um sistema de tracing, que pode ser implementado de diferentes formas dependendo da arquitetura de seu sistema.

```javascript
const CLSContext = require('zipkin-context-cls'),
      {Tracer} = require('zipkin'),
      {recorder} = require('./recorder'),
      ctxImpl = new CLSContext('zipkin'),
      tracer = new Tracer({ctxImpl, recorder});

//var to instrument the zipkin server           
var zipKinMidleware = require('zipkin-instrumentation-express').expressMiddleware;

//instrument the server
app.use(
    zipKinMidleware({
        tracer,
        serviceName: 'app' + port
    })
);
```

Traces
![Alt text](./img/README/vXx02Q.jpg?raw=true "ZipkinTraces")

Dependências
![Alt text](./img/README/DJdkLG.jpg?raw=true "ZipkinDependences")

https://github.com/openzipkin/zipkin-js

<b></b>







