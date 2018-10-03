/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import {
    Buckets,
    MetricRegistry,
    NANOSECOND,
    SimpleGauge,
    SlidingWindowReservoir,
    Taggable,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { Options, Percentiles, PrometheusMetricReporter } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite
export class ReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: PrometheusMetricReporter;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.reporter = new PrometheusMetricReporter(undefined, undefined, this.clock);
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
    public "check existence of all monotone counter"(): void {
        const counter = this.registry.newMonotoneCounter("test_counter_total");

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
    public "check existence of all counter fields"(): void {
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
    public "check existence of all gauge fields"(): void {
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

    @test
    public "check existence of all histogram fields"(): void {
        const histogram = this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n\n",
            );

        histogram.update(11);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 1\n" +
                "test_histo_bucket{le=\"30\"} 1\n" +
                "test_histo_bucket{le=\"40\"} 1\n" +
                "test_histo_bucket{le=\"50\"} 1\n" +
                "test_histo_bucket{le=\"+Inf\"} 1\n" +
                "test_histo_count{} 1\n" +
                "test_histo_sum{} 11\n\n",
            );

        histogram.update(340);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 1\n" +
                "test_histo_bucket{le=\"30\"} 1\n" +
                "test_histo_bucket{le=\"40\"} 1\n" +
                "test_histo_bucket{le=\"50\"} 1\n" +
                "test_histo_bucket{le=\"+Inf\"} 2\n" +
                "test_histo_count{} 2\n" +
                "test_histo_sum{} 351\n\n",
            );

        histogram.update(-119);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 1\n" +
                "test_histo_bucket{le=\"20\"} 2\n" +
                "test_histo_bucket{le=\"30\"} 2\n" +
                "test_histo_bucket{le=\"40\"} 2\n" +
                "test_histo_bucket{le=\"50\"} 2\n" +
                "test_histo_bucket{le=\"+Inf\"} 3\n" +
                "test_histo_count{} 3\n" +
                "test_histo_sum{} 232\n\n",
            );
    }

    @test
    public "check existence of all meter fields"(): void {
        const meter = this.registry.newMeter("test_meter");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n\n",
            );

        meter.mark(1);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 1\n\n",
            );

        meter.mark(-3);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} -2\n\n",
            );
    }

    @test
    public "check existence of all timer fields"(): void {
        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n\n",
        );

        timer.addDuration(11, NANOSECOND);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 11\n" +
                "test_timer{quantile=\"0.9\"} 11\n" +
                "test_timer_count{} 1\n" +
                "test_timer_sum{} 11\n\n",
        );

        timer.addDuration(5, NANOSECOND);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 11\n" +
                "test_timer{quantile=\"0.9\"} 11\n" +
                "test_timer_count{} 2\n" +
                "test_timer_sum{} 16\n\n",
        );

        timer.addDuration(35, NANOSECOND);

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 35\n" +
                "test_timer{quantile=\"0.9\"} 35\n" +
                "test_timer_count{} 3\n" +
                "test_timer_sum{} 51\n\n",
            );
    }

    @test
    public "check mixed metrics: no tags, no timestamp, no description"(): void {
        this.registry.newMonotoneCounter("test_monotone_counter_total");
        this.registry.newCounter("test_counter_total");
        this.registry.registerMetric(new SimpleGauge("test_gauge"));
        this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));
        this.registry.newMeter("test_meter");
        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{} 0\n\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{} 0\n\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n\n",
            );
    }

    @test
    public "check mixed metrics with timestamp"(): void {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.reporter = new PrometheusMetricReporter(new Options(true), undefined, this.clock);
        this.reporter.addMetricRegistry(this.registry);

        this.registry.newMonotoneCounter("test_monotone_counter_total");
        this.registry.newCounter("test_counter_total");
        this.registry.registerMetric(new SimpleGauge("test_gauge"));
        this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));
        this.registry.newMeter("test_meter");
        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        this.clock.setCurrentTime({ milliseconds: 1234, nanoseconds: 0 });
        const millis = new Date(this.clock.time().milliseconds).getUTCMilliseconds();

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                `test_monotone_counter_total{} 0 ${millis}\n\n` +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                `test_counter_total{} 0 ${millis}\n\n` +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                `test_gauge{} 0 ${millis}\n\n` +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                `test_histo_bucket{le=\"10\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"20\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"30\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"40\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"50\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"+Inf\"} 0 ${millis}\n` +
                `test_histo_count{} 0 ${millis}\n` +
                `test_histo_sum{} 0 ${millis}\n\n` +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                `test_meter{} 0 ${millis}\n\n` +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                `test_timer{quantile=\"0.5\"} 0 ${millis}\n` +
                `test_timer{quantile=\"0.75\"} 0 ${millis}\n` +
                `test_timer{quantile=\"0.9\"} 0 ${millis}\n` +
                `test_timer_count{} 0 ${millis}\n` +
                `test_timer_sum{} 0 ${millis}\n\n`,
            );
    }

    @test
    public "check mixed metrics with description"(): void {
        this.registry.newMonotoneCounter("test_monotone_counter_total", null, "monotone description");
        this.registry.newCounter("test_counter_total", null, "counter description");
        this.registry.registerMetric(new SimpleGauge("test_gauge"), null, "gauge description");
        this.registry.newHistogram("test_histo", null, null, "histogram description", Buckets.linear(10, 10, 5));
        this.registry.newMeter("test_meter", null, this.clock, null, "meter description");
        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3),
            "timer description");
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total monotone description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{} 0\n\n" +
                "# HELP test_counter_total counter description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{} 0\n\n" +
                "# HELP test_gauge gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n\n" +
                "# HELP test_histo histogram description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n\n" +
                "# HELP test_meter meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n\n" +
                "# HELP test_timer timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n\n",
            );
    }

    @test
    public "check mixed metrics with tags"(): void {
        let taggable: Taggable = null;

        taggable = this.registry.newMonotoneCounter("test_monotone_counter_total");
        taggable.setTag("type", "monotone_counter");
        taggable.setTag("host", "127.0.0.2");

        taggable = this.registry.newCounter("test_counter_total");
        taggable.setTag("type", "counter");
        taggable.setTag("host", "127.0.0.2");

        const gauge = new SimpleGauge("test_gauge");
        gauge.setTag("type", "simple_gauge");
        gauge.setTag("host", "127.0.0.2");
        this.registry.registerMetric(gauge);

        taggable = this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));
        taggable.setTag("type", "histogram");
        taggable.setTag("host", "127.0.0.2");

        taggable = this.registry.newMeter("test_meter");
        taggable.setTag("type", "meter");
        taggable.setTag("host", "127.0.0.2");

        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));
        timer.setTag("type", "timer");
        timer.setTag("host", "127.0.0.2");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{type=\"monotone_counter\",host=\"127.0.0.2\"} 0\n\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{type=\"counter\",host=\"127.0.0.2\"} 0\n\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{type=\"simple_gauge\",host=\"127.0.0.2\"} 0\n\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"10\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"20\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"30\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"40\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"50\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"+Inf\"} 0\n" +
                "test_histo_count{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "test_histo_sum{type=\"histogram\",host=\"127.0.0.2\"} 0\n\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{type=\"meter\",host=\"127.0.0.2\"} 0\n\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.5\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.75\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.9\"} 0\n" +
                "test_timer_count{type=\"timer\",host=\"127.0.0.2\"} 0\n" +
                "test_timer_sum{type=\"timer\",host=\"127.0.0.2\"} 0\n\n",
            );
    }

    @test
    public "check mixed metrics without comments"(): void {
        let taggable: Taggable = null;

        this.reporter = new PrometheusMetricReporter(new Options(false, false, false), undefined, this.clock);
        this.reporter.addMetricRegistry(this.registry);

        taggable = this.registry.newMonotoneCounter("test_monotone_counter_total");
        taggable.setTag("type", "monotone_counter");
        taggable.setTag("host", "127.0.0.2");

        taggable = this.registry.newCounter("test_counter_total");
        taggable.setTag("type", "counter");
        taggable.setTag("host", "127.0.0.2");

        const gauge = new SimpleGauge("test_gauge");
        gauge.setTag("type", "simple_gauge");
        gauge.setTag("host", "127.0.0.2");
        this.registry.registerMetric(gauge);

        taggable = this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));
        taggable.setTag("type", "histogram");
        taggable.setTag("host", "127.0.0.2");

        taggable = this.registry.newMeter("test_meter");
        taggable.setTag("type", "meter");
        taggable.setTag("host", "127.0.0.2");

        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));
        timer.setTag("type", "timer");
        timer.setTag("host", "127.0.0.2");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "test_monotone_counter_total{type=\"monotone_counter\",host=\"127.0.0.2\"} 0\n\n" +
                "test_counter_total{type=\"counter\",host=\"127.0.0.2\"} 0\n\n" +
                "test_gauge{type=\"simple_gauge\",host=\"127.0.0.2\"} 0\n\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"10\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"20\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"30\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"40\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"50\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"+Inf\"} 0\n" +
                "test_histo_count{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "test_histo_sum{type=\"histogram\",host=\"127.0.0.2\"} 0\n\n" +
                "test_meter{type=\"meter\",host=\"127.0.0.2\"} 0\n\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.5\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.75\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.9\"} 0\n" +
                "test_timer_count{type=\"timer\",host=\"127.0.0.2\"} 0\n" +
                "test_timer_sum{type=\"timer\",host=\"127.0.0.2\"} 0\n\n",
            );
    }

    @test
    public "check mixed metrics as untyped"(): void {
        this.reporter = new PrometheusMetricReporter(new Options(false, true, true), undefined, this.clock);
        this.reporter.addMetricRegistry(this.registry);

        this.registry.newMonotoneCounter("test_monotone_counter_total");
        this.registry.newCounter("test_counter_total");
        const gauge = new SimpleGauge("test_gauge");
        this.registry.registerMetric(gauge);
        this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));
        this.registry.newMeter("test_meter");

        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total untyped\n" +
                "test_monotone_counter_total{} 0\n\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total untyped\n" +
                "test_counter_total{} 0\n\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge untyped\n" +
                "test_gauge{} 0\n\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo untyped\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter untyped\n" +
                "test_meter{} 0\n\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer untyped\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n\n",
            );
    }

    @test
    public "check tag name compatibility"(): void {
        const taggable = this.registry.newMonotoneCounter("ccc");
        taggable.setTag("type", "monotone");
        taggable.setTag("host", "127.0.0.2");
        taggable.setTag("__reserved", "not gonna be included");
        taggable.setTag("_not_reserved", "not gonna be included");
        taggable.setTag("0123", "not gonna be included");
        taggable.setTag("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_", "something");
        taggable.setTag("special:tag", "replaced");
        taggable.setTag("my_µ", "replaced");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP ccc ccc description\n" +
                "# TYPE ccc counter\n" +
                "ccc{type=\"monotone\",host=\"127.0.0.2\"," +
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_=\"something\"," +
                "special_tag=\"replaced\",my__=\"replaced\"} 0\n\n",
            );
    }

    @test
    public "check matric name compatibility"(): void {
        this.reporter = new PrometheusMetricReporter(new Options(false, false, false));
        this.reporter.addMetricRegistry(this.registry);

        this.registry.newMonotoneCounter("__test1");
        this.registry.newMonotoneCounter("_test2");
        this.registry.newMonotoneCounter("test_3");
        this.registry.newMonotoneCounter("group:test");
        this.registry.newMonotoneCounter("0:test1");
        this.registry.newMonotoneCounter("request_ÄÖÜßäöü");
        this.registry.newMonotoneCounter("@µabc");

        expect(this.reporter.getMetricsString()).to.be
            .equal(
                "__test1{} 0\n\n" +
                "_test2{} 0\n\n" +
                "test_3{} 0\n\n" +
                "group:test{} 0\n\n" +
                "_:test1{} 0\n\n" +
                "request________{} 0\n\n" +
                "__abc{} 0\n\n",
            );
    }

}
