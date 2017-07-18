# pocResilienciaJs
Projeto implementando hystrix e zipkin em node.js

Os serviços, aplicações e dashboard ficam expostos nas seguintes portas: 
Serviços: 3001,3002,3003,3006(FallBack)
Aplicações: 3004, 3005
Hystrix Dashboard: 8000
Zipkin: 9411
Consul: 8500

Os serviços e aplicações estão configurados para apresentarem latência e indisponibilidade por parâmetros.

<b>Hystrix<b>

npm --save hystrixjs

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
```

<b>Hystrix Dashboard</b>

Para iniciar o monitoramento via dashboard do funcionamento das aplicações e sua reciliência adicionar o stream de log de cada aplicação ao dashboard:

http://localhost:3004/api/hystrix.stream

http://localhost:3005/api/hystrix.stream

Exemplo: 
![Alt text](./img/README/2F8cCD.jpg?raw=true "Hystrix")

<b>Zipkin</b>

Traces
![Alt text](./img/README/vXx02Q.jpg?raw=true "ZipkinTraces")

Dependências
![Alt text](./img/README/DJdkLG.jpg?raw=true "ZipkinDependences")

<b></b>







