import { Event } from "inspector-metrics";
import { hostname } from "os";

import { MetricsSupport } from "./metrics";

async function start() {
    const metricsSupport = new MetricsSupport();
    await metricsSupport.init();

    const event = new Event("event", "marks the startup of this application", null, new Date())
        .setTag("type", "application-start")
        .setTag("text", `application started at ${new Date()} on host ${hostname()}`)
        .setValue(1);
    metricsSupport.reportEvent(event);
}

start();
