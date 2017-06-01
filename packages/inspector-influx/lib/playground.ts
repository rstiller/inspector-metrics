import { MetricRegistry, Timer } from "inspector-metrics";
import { InfluxMetricReporter } from "./metrics/influx-metric-reporter";

// influxdb config from https://github.com/node-influx/node-influx/blob/master/src/index.ts#L80
const dbConfig = {
    database: "example-db",
    hosts: [
        { host: "influx", port: 8086 },
    ],
    password: "admin",
    username: "admin",
};

const reporter: InfluxMetricReporter = new InfluxMetricReporter(dbConfig);
const registry: MetricRegistry = new MetricRegistry();
const requests: Timer = registry.newTimer("requests");

requests.setTag("host", "localhost");

reporter.setLog(global.console);
reporter.addMetricRegistry(registry);

reporter.start();

// example usage
setInterval(() => {
    // should report a few milliseconds
    requests.time(() => {
        let a = 0;
        const b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
    });
}, 100);
