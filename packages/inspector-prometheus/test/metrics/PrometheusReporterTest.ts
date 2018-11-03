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
import { Percentiles, PrometheusMetricReporter } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite
export class PrometheusReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: PrometheusMetricReporter;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
        });
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public async "reporting with no MetricRegistries added"() {
        this.reporter.removeMetricRegistry(this.registry);
        expect(await this.reporter.getMetricsString()).to.be.equal("\n");
    }

    @test
    public async "reporting with a single MetricRegistry added, that is empty"() {
        expect(await this.reporter.getMetricsString()).to.be.equal("");
    }

    @test
    public async "check existence of all monotone counter"() {
        const counter = this.registry.newMonotoneCounter("test_counter_total");

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 0\n",
            );

        counter.increment(1);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 1\n",
            );

        counter.increment(22);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total counter\n" +
                "test_counter_total{} 23\n",
            );
    }

    @test
    public async "check existence of all counter fields"() {
        const counter = this.registry.newCounter("test_counter");

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} 0\n",
            );

        counter.increment(1);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} 1\n",
            );

        counter.decrement(3);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_counter test_counter description\n" +
                "# TYPE test_counter gauge\n" +
                "test_counter{} -2\n",
            );
    }

    @test
    public async "check existence of all gauge fields"() {
        const gauge = new SimpleGauge("test_gauge");
        this.registry.registerMetric(gauge);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n",
            );

        gauge.setValue(32.32);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 32.32\n",
            );

        gauge.setValue(-87);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} -87\n",
            );

        gauge.setValue(NaN);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} NaN\n",
            );

        gauge.setValue(Infinity);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} +Inf\n",
            );

        gauge.setValue(-Infinity);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} -Inf\n",
            );
    }

    @test
    public async "check existence of all histogram fields"() {
        const histogram = this.registry.newHistogram("test_histo", null, null, null, Buckets.linear(10, 10, 5));

        expect(await this.reporter.getMetricsString()).to.be
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
                "test_histo_sum{} 0\n",
            );

        histogram.update(11);

        expect(await this.reporter.getMetricsString()).to.be
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
                "test_histo_sum{} 11\n",
            );

        histogram.update(340);

        expect(await this.reporter.getMetricsString()).to.be
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
                "test_histo_sum{} 351\n",
            );

        histogram.update(-119);

        expect(await this.reporter.getMetricsString()).to.be
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
                "test_histo_sum{} 232\n",
            );
    }

    @test
    public async "check existence of all meter fields"() {
        const meter = this.registry.newMeter("test_meter");

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n",
            );

        meter.mark(1);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 1\n",
            );

        meter.mark(-3);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} -2\n",
            );
    }

    @test
    public async "check existence of all timer fields"() {
        const timer = this.registry.newTimer(
            "test_timer",
            null,
            this.registry.getDefaultClock(),
            new SlidingWindowReservoir(3));
        timer.setMetadata(Percentiles.METADATA_NAME, new Percentiles([0.5, 0.75, 0.9]));

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n",
        );

        timer.addDuration(11, NANOSECOND);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 11\n" +
                "test_timer{quantile=\"0.9\"} 11\n" +
                "test_timer_count{} 1\n" +
                "test_timer_sum{} 11\n",
        );

        timer.addDuration(5, NANOSECOND);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 11\n" +
                "test_timer{quantile=\"0.9\"} 11\n" +
                "test_timer_count{} 2\n" +
                "test_timer_sum{} 16\n",
        );

        timer.addDuration(35, NANOSECOND);

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 11\n" +
                "test_timer{quantile=\"0.75\"} 35\n" +
                "test_timer{quantile=\"0.9\"} 35\n" +
                "test_timer_count{} 3\n" +
                "test_timer_sum{} 51\n",
            );
    }

    @test
    public async "check mixed metrics: no tags, no timestamp, no description"() {
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{} 0\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{} 0\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n",
            );
    }

    @test
    public async "check mixed metrics with timestamp"() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
            includeTimestamp: true,
        });
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                `test_monotone_counter_total{} 0 ${millis}\n` +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                `test_counter_total{} 0 ${millis}\n` +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                `test_gauge{} 0 ${millis}\n` +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                `test_histo_bucket{le=\"10\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"20\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"30\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"40\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"50\"} 0 ${millis}\n` +
                `test_histo_bucket{le=\"+Inf\"} 0 ${millis}\n` +
                `test_histo_count{} 0 ${millis}\n` +
                `test_histo_sum{} 0 ${millis}\n` +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                `test_meter{} 0 ${millis}\n` +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                `test_timer{quantile=\"0.5\"} 0 ${millis}\n` +
                `test_timer{quantile=\"0.75\"} 0 ${millis}\n` +
                `test_timer{quantile=\"0.9\"} 0 ${millis}\n` +
                `test_timer_count{} 0 ${millis}\n` +
                `test_timer_sum{} 0 ${millis}\n`,
            );
    }

    @test
    public async "check mixed metrics with description"() {
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total monotone description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{} 0\n" +
                "# HELP test_counter_total counter description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{} 0\n" +
                "# HELP test_gauge gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{} 0\n" +
                "# HELP test_histo histogram description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n" +
                "# HELP test_meter meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{} 0\n" +
                "# HELP test_timer timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n",
            );
    }

    @test
    public async "check mixed metrics with tags"() {
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total counter\n" +
                "test_monotone_counter_total{type=\"monotone_counter\",host=\"127.0.0.2\"} 0\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total gauge\n" +
                "test_counter_total{type=\"counter\",host=\"127.0.0.2\"} 0\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge gauge\n" +
                "test_gauge{type=\"simple_gauge\",host=\"127.0.0.2\"} 0\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo histogram\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"10\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"20\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"30\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"40\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"50\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"+Inf\"} 0\n" +
                "test_histo_count{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "test_histo_sum{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter gauge\n" +
                "test_meter{type=\"meter\",host=\"127.0.0.2\"} 0\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer summary\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.5\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.75\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.9\"} 0\n" +
                "test_timer_count{type=\"timer\",host=\"127.0.0.2\"} 0\n" +
                "test_timer_sum{type=\"timer\",host=\"127.0.0.2\"} 0\n",
            );
    }

    @test
    public async "check mixed metrics without comments"() {
        let taggable: Taggable = null;

        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
            emitComments: false,
            includeTimestamp: false,
            useUntyped: false,
        });
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "test_monotone_counter_total{type=\"monotone_counter\",host=\"127.0.0.2\"} 0\n" +
                "test_counter_total{type=\"counter\",host=\"127.0.0.2\"} 0\n" +
                "test_gauge{type=\"simple_gauge\",host=\"127.0.0.2\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"10\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"20\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"30\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"40\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"50\"} 0\n" +
                "test_histo_bucket{type=\"histogram\",host=\"127.0.0.2\",le=\"+Inf\"} 0\n" +
                "test_histo_count{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "test_histo_sum{type=\"histogram\",host=\"127.0.0.2\"} 0\n" +
                "test_meter{type=\"meter\",host=\"127.0.0.2\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.5\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.75\"} 0\n" +
                "test_timer{type=\"timer\",host=\"127.0.0.2\",quantile=\"0.9\"} 0\n" +
                "test_timer_count{type=\"timer\",host=\"127.0.0.2\"} 0\n" +
                "test_timer_sum{type=\"timer\",host=\"127.0.0.2\"} 0\n",
            );
    }

    @test
    public async "check mixed metrics as untyped"() {
        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
            emitComments: true,
            includeTimestamp: false,
            useUntyped: true,
        });
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

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP test_monotone_counter_total test_monotone_counter_total description\n" +
                "# TYPE test_monotone_counter_total untyped\n" +
                "test_monotone_counter_total{} 0\n" +
                "# HELP test_counter_total test_counter_total description\n" +
                "# TYPE test_counter_total untyped\n" +
                "test_counter_total{} 0\n" +
                "# HELP test_gauge test_gauge description\n" +
                "# TYPE test_gauge untyped\n" +
                "test_gauge{} 0\n" +
                "# HELP test_histo test_histo description\n" +
                "# TYPE test_histo untyped\n" +
                "test_histo_bucket{le=\"10\"} 0\n" +
                "test_histo_bucket{le=\"20\"} 0\n" +
                "test_histo_bucket{le=\"30\"} 0\n" +
                "test_histo_bucket{le=\"40\"} 0\n" +
                "test_histo_bucket{le=\"50\"} 0\n" +
                "test_histo_bucket{le=\"+Inf\"} 0\n" +
                "test_histo_count{} 0\n" +
                "test_histo_sum{} 0\n" +
                "# HELP test_meter test_meter description\n" +
                "# TYPE test_meter untyped\n" +
                "test_meter{} 0\n" +
                "# HELP test_timer test_timer description\n" +
                "# TYPE test_timer untyped\n" +
                "test_timer{quantile=\"0.5\"} 0\n" +
                "test_timer{quantile=\"0.75\"} 0\n" +
                "test_timer{quantile=\"0.9\"} 0\n" +
                "test_timer_count{} 0\n" +
                "test_timer_sum{} 0\n",
            );
    }

    @test
    public async "check tag name compatibility"() {
        const taggable = this.registry.newMonotoneCounter("ccc");
        taggable.setTag("type", "monotone");
        taggable.setTag("host", "127.0.0.2");
        taggable.setTag("__reserved", "not gonna be included");
        taggable.setTag("_not_reserved", "not gonna be included");
        taggable.setTag("0123", "not gonna be included");
        taggable.setTag("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_", "something");
        taggable.setTag("special:tag", "replaced");
        taggable.setTag("my_µ", "replaced");

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "# HELP ccc ccc description\n" +
                "# TYPE ccc counter\n" +
                "ccc{type=\"monotone\",host=\"127.0.0.2\"," +
                "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_=\"something\"," +
                "special_tag=\"replaced\",my__=\"replaced\"} 0\n",
            );
    }

    @test
    public async "check matric name compatibility"() {
        this.reporter = new PrometheusMetricReporter({
            emitComments: false,
            includeTimestamp: false,
            useUntyped: false,
        });
        this.reporter.addMetricRegistry(this.registry);

        this.registry.newMonotoneCounter("__test1");
        this.registry.newMonotoneCounter("_test2");
        this.registry.newMonotoneCounter("test_3");
        this.registry.newMonotoneCounter("group:test");
        this.registry.newMonotoneCounter("0:test1");
        this.registry.newMonotoneCounter("request_ÄÖÜßäöü");
        this.registry.newMonotoneCounter("@µabc");

        expect(await this.reporter.getMetricsString()).to.be
            .equal(
                "__test1{} 0\n\n" +
                "_test2{} 0\n\n" +
                "test_3{} 0\n\n" +
                "group:test{} 0\n\n" +
                "_:test1{} 0\n\n" +
                "request________{} 0\n\n" +
                "__abc{} 0\n",
            );
    }

}
