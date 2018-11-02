import { MetricRegistry, Timer } from "inspector-metrics";
import { DefaultSender } from "../lib/metrics/DefaultSender";
import { InfluxMetricReporter } from "../lib/metrics/InfluxMetricReporter";

// influxdb config from https://github.com/node-influx/node-influx/blob/master/src/index.ts#L80
const dbConfig = {
    database: "example-db",
    hosts: [
        { host: "127.0.0.1", port: 8086 },
    ],
    password: "admin",
    username: "admin",
};

const sender = new DefaultSender(dbConfig);
const reporter: InfluxMetricReporter = new InfluxMetricReporter({
    sender,
});
const registry: MetricRegistry = new MetricRegistry();
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
requests3.setTag("host", "127.0.0.3");

// quick & dirty hack ...
global.console.debug = global.console.info;
reporter.setLog(global.console);
reporter.addMetricRegistry(registry);

reporter.start();

setInterval(() => {
    requests1.time(() => {
        let a = 0;
        const b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
        a = a + 0;
    });
}, 100);

setInterval(() => {
    requests2.time(() => {
        let a = 0;
        const b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
        a = a + 0;
    });
}, 50);

setInterval(() => {
    requests3.time(() => {
        let a = 0;
        const b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
        a = a + 0;
    });
}, 25);
