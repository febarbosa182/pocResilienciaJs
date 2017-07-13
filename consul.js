const consul = require('consul')(),
      app = require('express')();

module.exports = function(){
    app.use(consui(

    ));
}

const consulId = require('uuid').v4();


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
        console.log('told Consul that we are healthy');
      });
    }, 5 * 1000);
});

