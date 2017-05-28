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

        const majorRuns: Timer = metric.getMetrics().get("majorGCRuns") as Timer;
        // tslint:disable-next-line:no-console
        console.log();
        while (majorRuns.getCount() <= 0) {
            crypto.randomBytes(1024);
        }
    }

}
