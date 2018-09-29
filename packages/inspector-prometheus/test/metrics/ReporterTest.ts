/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { MetricRegistry, SimpleGauge } from "inspector-metrics";
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
        expect(this.reporter.getMetricsString()).to.be.equal("\n");
    }

    @test
    public "reporting with a single MetricRegistry added, that is empty"(): void {
        expect(this.reporter.getMetricsString()).to.be.equal("\n");
    }

    @test
    public "check existence of all monotone counter: no tags, no timestamp, no description"(): void {
        const counter = this.registry.newMonotoneCounter("test_counter");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 0\n\n",
            );

        counter.increment(1);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 1\n\n",
            );

        counter.increment(22);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 23\n\n",
            );
    }

    @test
    public "check existence of all counter fields: no tags, no timestamp, no description"(): void {
        const counter = this.registry.newCounter("test_counter");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} 0\n\n",
            );

        counter.increment(1);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} 1\n\n",
            );

        counter.decrement(3);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} -2\n\n",
            );
    }

    @test
    public "check existence of all gauge fields: no tags, no timestamp, no description"(): void {
        const gauge = new SimpleGauge("test_gauge");
        this.registry.registerMetric(gauge);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n\n",
            );

        gauge.setValue(32.32);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 32.32\n\n",
            );

        gauge.setValue(-87);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} -87\n\n",
            );

        gauge.setValue(NaN);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} NaN\n\n",
            );

        gauge.setValue(Infinity);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} +Inf\n\n",
            );

        gauge.setValue(-Infinity);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} -Inf\n\n",
            );
    }

}
