import 'reflect-metadata'

// import * as chai from "chai";
import { suite, test } from '@testdeck/mocha'

// import { InfluxMetricReporter } from "../../lib/metrics/influx-metric-reporter";

// const expect = chai.expect;

@suite
export class InfluxMetricReporterTest {
  @test
  public checkNothing(): void {}
}
