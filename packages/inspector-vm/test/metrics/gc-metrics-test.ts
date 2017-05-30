// tslint:disable:no-unused-expression
import * as crypto from "crypto";
import "source-map-support/register";

import * as chai from "chai";
import { StdClock, Timer } from "inspector-metrics";
import { suite, test, timeout } from "mocha-typescript";
import { GCMetrics } from "../../lib/metrics/gc-metrics";

const expect = chai.expect;

@suite
export class GCMetricsTest {

    @test
    @timeout(60000)
    public checkNothing(): void {
        const metric: GCMetrics = new GCMetrics(new StdClock());

        expect(metric).to.exist;

        const majorRuns: Timer = metric.getMetricList()
            .filter((m) => {
                return m.getName() === "runs" && m.getTag("type") === "major";
            })[0] as Timer;

        // causing garbage collaction ...
        while (majorRuns.getCount() <= 0) {
            for (let i = 0; i < 100; i++) {
                crypto.randomBytes(1024 * 16);
            }
        }
    }

}
