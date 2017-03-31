/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

// import * as chai from "chai";
import { suite, test } from "mocha-typescript";

// import { InfluxMetricReporter } from "../../lib/metrics/influx-metric-reporter";

// const expect = chai.expect;

@suite("InfluxMetricReporter")
export class InfluxMetricReporterTest {

    @test("nothing")
    public checkNothing(): void {
    }

}
