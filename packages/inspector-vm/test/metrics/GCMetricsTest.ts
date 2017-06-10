// tslint:disable:no-unused-expression
import * as crypto from "crypto";
import "source-map-support/register";

import * as chai from "chai";
import { MetricRegistry, StdClock, Timer } from "inspector-metrics";
import { suite, test, timeout } from "mocha-typescript";
import { GCMetrics } from "../../lib/metrics/GCMetrics";

const expect = chai.expect;

@suite
export class GCMetricsTest {

    @test
    @timeout(10000)
    public checkGCActivity(): void {
        const metric: GCMetrics = new GCMetrics("vm", new StdClock());

        expect(metric).to.exist;

        const majorRuns: Timer = metric.getMetricList()
            .filter((m) => {
                return m.getName() === "runs" && m.getTag("type") === "major";
            })[0] as Timer;

        // causing garbage collection ...
        while (majorRuns.getCount() <= 0) {
            for (let i = 0; i < 1000; i++) {
                crypto.randomBytes(1024 * 16);
            }
        }
    }

    @test
    public settingGroup(): void {
        const metric: GCMetrics = new GCMetrics("vm", new StdClock());

        expect(metric.getGroup()).to.not.exist;
        metric.getMetricList().forEach((submetric) => {
            expect(submetric.getGroup()).to.not.exist;
        });

        metric.setGroup("abc");
        expect(metric.getGroup()).to.equal("abc");
        metric.getMetricList().forEach((submetric) => {
            expect(submetric.getGroup()).to.equal("abc");
        });
    }

    @test
    public settingTag(): void {
        const metric: GCMetrics = new GCMetrics("vm", new StdClock());

        metric.setTag("type", "value");
        expect(metric.getTag("type")).to.equal("value");
        metric.getMetricList().forEach((submetric) => {
            expect(submetric.getTag("type")).to.equal("value");
        });

        metric.removeTag("type");
        expect(metric.getTag("type")).to.not.exist;
        metric.getMetricList().forEach((submetric) => {
            expect(submetric.getTag("type")).to.not.exist;
        });
    }

    @test
    public checkRegistration(): void {
        const registry = new MetricRegistry();
        const metric: GCMetrics = new GCMetrics("vm", new StdClock());

        registry.registerMetric(metric);

        expect(registry.getMetricList()).to.have.length(metric.getMetricList().length);
        registry.getMetricList().forEach((submetric) => {
            expect(submetric.getGroup()).to.equal("vm");
        });
    }

}
