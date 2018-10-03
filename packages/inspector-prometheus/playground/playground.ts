// tslint:disable:no-console

import * as Hapi from "hapi";
import { MetricRegistry, MILLISECOND, Timer } from "inspector-metrics";
import { PrometheusMetricReporter } from "../lib/metrics";

const registry: MetricRegistry = new MetricRegistry();
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
requests3.setTag("host", "127.0.0.3");

requests1.addDuration(100, MILLISECOND);
requests1.addDuration(102, MILLISECOND);
requests1.addDuration(104, MILLISECOND);

requests2.addDuration(20, MILLISECOND);
requests2.addDuration(35, MILLISECOND);
requests2.addDuration(50, MILLISECOND);

requests3.addDuration(123, MILLISECOND);
requests3.addDuration(456, MILLISECOND);
requests3.addDuration(789, MILLISECOND);

const reporter = new PrometheusMetricReporter();
const tags = new Map();

tags.set("app_version", "1.0.0");
tags.set("app_id", "test_env_playground");

reporter.setTags(tags);

reporter.addMetricRegistry(registry);

const server = new Hapi.Server({
    host: "0.0.0.0",
    port: 8080,
});

server.route({
    method: "GET",
    path: "/metrics",
    handler(request, h) {
        console.log("reporting metrics");
        return h.response(reporter.getMetricsString())
            .code(200)
            .type("text/plain");
    },
});

async function start() {

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log("Server running at:", server.info.uri);
}

start();

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
