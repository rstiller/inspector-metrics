// tslint:disable:no-console

import { MetricRegistry, Timer } from "inspector-metrics";
import moment = require("moment");
import { CsvMetricReporter, CsvMetricReporterOptions } from "../lib/metrics";
import { DefaultCsvFileWriter, DefaultCsvFileWriterOptions } from "../lib/metrics/DefaultCsvFileWriter";

const registry: MetricRegistry = new MetricRegistry();
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
requests3.setTag("host", "127.0.0.3");

const writer = new DefaultCsvFileWriter(new DefaultCsvFileWriterOptions({
    dir: async () => ".",
    filename: async () => `${moment().format("YYYY-MM-DD-HH-mm")}_metrics.csv`,
}));
const reporter = new CsvMetricReporter(new CsvMetricReporterOptions({
    columns: ["date", "group", "name", "field", "value"],
    writer,
}));

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
