/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import {
    MetricRegistry,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { CsvMetricReporter } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite
export class CsvReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: CsvMetricReporter;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.reporter = new CsvMetricReporter();
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public "check nothing"(): void {
        expect(this.reporter).to.not.be.undefined;
    }

}
