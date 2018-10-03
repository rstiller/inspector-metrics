/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as nock from "nock";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import {
    Buckets, MetricRegistry, Scheduler, SECOND, SimpleGauge, SlidingWindowReservoir,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import {
    Percentiles,
    PrometheusMetricReporter,
    PushgatewayMetricReporter,
    PushgatewayReporterOptions } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

chai.use(sinonChai);

const expect = chai.expect;

nock("http://localhost:9091")
    .put("/metrics/job/test-pushgateway-reporter/instance/localhost")
    .reply(202, "Accepted");

@suite
export class PushgatewayReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private prometheusReporter: PrometheusMetricReporter;
    private reporter: PushgatewayMetricReporter;
    private internalCallback: () => void;
    private scheduler: Scheduler;
    private schedulerSpy: SinonSpy;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.prometheusReporter = new PrometheusMetricReporter(undefined, undefined, this.clock);
        this.prometheusReporter.addMetricRegistry(this.registry);

        this.scheduler = (prog: () => void, interval: number): NodeJS.Timer => {
            this.internalCallback = prog;
            return null;
        };
        this.schedulerSpy = spy(this.scheduler);

        this.reporter = new PushgatewayMetricReporter(
            this.prometheusReporter,
            new PushgatewayReporterOptions(
                "localhost",
                9091,
                "test-pushgateway-reporter",
                "localhost",
            ),
            10,
            SECOND,
            null,
            this.schedulerSpy,
        );
    }

    @test
    public "check reporting with PrometheusMetricReporter"(): void {
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

        expect(this.schedulerSpy).to.not.have.been.called;

        this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        const payload = this.internalCallback();
        expect(payload).to.be
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

}
