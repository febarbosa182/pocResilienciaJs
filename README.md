# pocResilienciaJs
Projeto implementando hystrix, zipkin e consul em node.js

Para subir todos os serviços, aplicações e dashboard executar na raiz do projeto no terminal: node index.js

Serviços (portas): 3001,3002,3003
Aplicações (portas): 3004, 3005
Dashboard (portas): 8000

Os serviços e aplicações estão configurados para apresentarem latência e indisponibilidade.

Hystrix

Para iniciar o monitoramento do funcionamento adicionar o stream de log de cada aplicação ao dashboard:
http://localhost:3004/api/hystrix.stream
http://localhost:3005/api/hystrix.stream

Exemplo: https://snag.gy/2F8cCD.jpg

Zipkin

Para subir o serviço do zipkin, no prompt de comando:
docker run -d -p 9411:9411 openzipkin/zipkin

Isso subira o serviço no localhost:9411 que listara o traces gerados pela aplicação.

*a aplicação esta configurada para enviar os traces para o localhost:9411, essa rota pode ser alterada no recorder.js
