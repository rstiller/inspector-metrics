/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { MetricRegistry } from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { PrometheusMetricReporter } from "../../lib/metrics";

const expect = chai.expect;

@suite
export class ReporterTest {

    private registry: MetricRegistry;
    private reporter: PrometheusMetricReporter;

    public before() {
        this.registry = new MetricRegistry();
        this.reporter = new PrometheusMetricReporter();
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public "reporting with no MetricRegistries added"(): void {
        this.reporter.removeMetricRegistry(this.registry);
        expect(this.reporter.getMetricsString()).to.be.empty;
    }

    @test
    public "reporting with a single MetricRegistry added, that is empty"(): void {
        expect(this.reporter.getMetricsString()).to.be.empty;
    }

    @test
    public "check existence of all counter fields without tags, without timestamp"(): void {
        const counter = this.registry.newCounter("test_counter");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_count test_counter_count description\n" +
                "# TYPE test_counter_count untyped\n" +
                "test_counter_count{} 0\n",
            );

        counter.increment(1);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_count test_counter_count description\n" +
                "# TYPE test_counter_count untyped\n" +
                "test_counter_count{} 1\n",
            );

        counter.decrement(2);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_count test_counter_count description\n" +
                "# TYPE test_counter_count untyped\n" +
                "test_counter_count{} -1\n",
            );
    }

}
