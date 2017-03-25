process.env.APP_ENV = "playground";

import "reflect-metadata";
import "source-map-support/register";

import { MetricRegistry } from "./metrics/metric-registry";

let registry: MetricRegistry = new MetricRegistry();

let timer = registry.newTimer("call-timer");
timer.setTag("application", "stan2");
timer.setTag("mode", "playground");

setInterval(() => {
    timer.time(() => {
        let a = 0;
        let b = 1;
        for (let i = 0; i < 1e6; i++) {
            a = b + i;
        }
    });
}, 100);
