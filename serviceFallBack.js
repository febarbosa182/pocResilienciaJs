var express = require('express'),
    getRandomInt = require('./random_int');

const CLSContext = require('zipkin-context-cls'),
      {Tracer} = require('zipkin'),
      {recorder} = require('./recorder'),
      ctxImpl = new CLSContext('zipkin'),
      tracer = new Tracer({ctxImpl,recorder}),
      zipkinMiddleware = require('zipkin-instrumentation-express').expressMiddleware;

module.exports = function(port) {
    var app = express(),
        reqs = 0,
        sickPercentage = 0.01,
        maxSetSickTimeout = 0.01,
        sick = false,
        maintenancePercentage = 0.01,
        maxSetMaintenanceTimeout = 0.01,
        maintenance = false;
    
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
        
        if (maintenance) {
            res.status(503).send("Temporaly Unavailable");
            return;
        }

        var ms;

        if (sick) {
            ms = getRandomInt(0, 10 * parseInt(req.params.ms));
        } else {
            ms = getRandomInt(0, parseInt(req.params.ms));
        }
        setTimeout(function() {
            res.send("OK: slept " + ms + " ms");
        }, ms);
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
