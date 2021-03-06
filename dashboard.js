const express = require('express');
const app = express();
const dashboard = require('hystrix-dashboard');
 

module.exports = function(port) {

app.use(dashboard({
    idleTimeout: 4000,  // will emit "ping if no data comes within 4 seconds, 
    interval: 2000,      // interval to collect metrics 
    proxy: true         // enable proxy for stream 
}));
    this.start = function() {
        process.title = 'node (dashboard:' + port + ')';
        app.listen(port, function() {
            var start = Date.now();
            console.log("[%d] DASHBOARD Listening on %d", process.pid, port);
        });
    };
}