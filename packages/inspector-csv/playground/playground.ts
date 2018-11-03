// tslint:disable:no-console

import { MetricRegistry, Timer } from "inspector-metrics";
import { CsvMetricReporter, ExportMode } from "../lib/metrics";
import { DefaultCsvFileWriter } from "../lib/metrics/DefaultCsvFileWriter";

const registry: MetricRegistry = new MetricRegistry();
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
requests2.setTag("type", "override_tag");
requests3.setTag("host", "127.0.0.3");
requests3.setTag("special_tag", "test_abc");

const writer = new DefaultCsvFileWriter({});
const reporter = new CsvMetricReporter({
    columns: ["date", "group", "name", "field", "value", "type", "tags"],
    tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
    writer,
});

const tags = new Map();
tags.set("type", "metric");
reporter.setTags(tags);

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
