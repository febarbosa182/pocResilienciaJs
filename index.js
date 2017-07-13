var cluster = require('cluster'),
    Service = require('./service'),
    ServiceFallBack = require('./serviceFallBack'),
    EndUser = require('./end_user'),
    App = require('./app'),
    Dashboard = require('./dashboard');

var opts = {
    USER_WORKERS: 2,
    USERS_PER_WORKER: 5,
    USERS_MIN_SLEEP: 100,
    USERS_MAX_SLEEP: 750,
    SERVICE_PORT_1: 3001,
    SERVICE_PORT_2: 3002,
    SERVICE_PORT_3: 3003,
    SERVICE_PORT_4: 3006,
    APP_PORT_1: 3004,
    APP_PORT_2: 3005,
    DASHBOARD_PORT: 8000,
    GLOBALAGENT_MAXSOCKETS: 1000
};

require('http').globalAgent.maxSockets = opts.GLOBALAGENT_MAXSOCKETS;

var services = [{
    port: opts.SERVICE_PORT_1,
    timeout: 500,
    resetTime: 1000,
    concurrency: 6,
    errorThreshold: 10,
    errorNamesThresholds: {
        ServiceUnavailableError: 0
    },
    // app will make N calls to this service per user request
    calls: 1,
    // app will tell service to random sleep until N ms
    sleep: 1200
}, {
    port: opts.SERVICE_PORT_2,
    timeout: 600,
    resetTime: 600,
    concurrency: 6,
    errorThreshold: 10,
    errorNamesThresholds: {
        ServiceUnavailableError: 0
    },
    calls: 1,
    sleep: 1800
}, {
    port: opts.SERVICE_PORT_3,
    timeout: 1300,
    resetTime: 600,
    concurrency: 4,
    errorThreshold: 10,
    errorNamesThresholds: {
        ServiceUnavailableError: 0
    },
    calls: 1,
    sleep: 100
}];

var serviceFallBack = {
    port: opts.SERVICE_PORT_4,
    timeout: 2000,
    resetTime: 1000,
    concurrency: 1,
    errorThreshold: 10,
    errorNamesThresholds: {
        ServiceUnavailableError: 0
    },
    calls: 1,
    sleep: 100
};

var apps = [opts.APP_PORT_1, opts.APP_PORT_2];

var dashboardServer = {
    port: opts.DASHBOARD_PORT
};

if (cluster.isMaster) {
    var serviceWorkers = [],
        serviceFallBackWorker = null,
        appWorkers = [],
        userWorkers = [],
        dashboardWorkers = null;
    
    console.log("You have 5 seconds to abort...");
    function countdown(n) {
        if (n >= 1) {
            console.log("%d...", n);
            setTimeout(function() {
                countdown(n-1);
            }, 1000);
        } else {
            console.log("This will get a bit verbose...");
            setTimeout(start, 1000);
        }
    }
    countdown(5);

    function start() {

    services.forEach(function(service) {
        serviceWorkers.push(cluster.fork({service: service.port}));
    });

    apps.forEach(function(port) {
        appWorkers.push(cluster.fork({app: port}));
    });

    for (var i = 0; i < opts.USER_WORKERS; i++) {
        userWorkers.push(cluster.fork());
    }

    serviceWorkers.forEach(function(worker) {
        worker.send('start');
    });

    appWorkers.forEach(function(worker) {
        worker.send({
            msg: 'start',
            config: {services: services},
            fallBackConfigure: serviceFallBack
        });
    });

    userWorkers.forEach(function(worker) {
        worker.send('start');
    });

    dashboardWorkers = cluster.fork({dashboardServer: dashboardServer.port});
    dashboardWorkers.send('start');
    
    serviceFallBackWorker = cluster.fork({serviceFallBack: serviceFallBack.port});
    serviceFallBackWorker.send('start');

    }
} else {
    if (process.env.service) {
        var service = new Service(parseInt(process.env.service));
        process.on('message', function(msg) {
            if (msg == 'start') {
                service.start();
            }
        });
    } else if (process.env.app) {
        var app = new App(parseInt(process.env.app));
        process.on('message', function(msg) {
            if (msg.msg == 'start') {
                app.configure(msg.config);
                app.fallBackConfigure(msg.fallBackConfigure);
                app.start();
            }
        });
    } else if (process.env.dashboardServer) {
        var dashboard = new Dashboard(process.env.dashboardServer);
        process.on('message', function(msg) {
            if (msg == 'start') {
                dashboard.start();
            }
        });
    } else if (process.env.serviceFallBack) {
        var serviceFallBack = new ServiceFallBack(process.env.serviceFallBack);
        process.on('message', function(msg) {
            if (msg == 'start') {
                serviceFallBack.start();
            }
        });
    } else {
        var user = new EndUser(apps);
        process.on('message', function(msg) {
            if (msg == 'start') {
                user.start({
                    users: opts.USERS_PER_WORKER,
                    minSleep: opts.USERS_MIN_SLEEP,
                    maxSleep: opts.USERS_MAX_SLEEP
                });
            }
        });
    }
}

