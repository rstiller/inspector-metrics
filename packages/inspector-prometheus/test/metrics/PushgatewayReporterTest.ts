/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as nock from "nock";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import {
    Buckets, Event, MetricRegistry, Scheduler, SimpleGauge, SlidingWindowReservoir,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import {
    Percentiles,
    PrometheusMetricReporter,
    PushgatewayMetricReporter,
} from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class PushgatewayReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private prometheusReporter: PrometheusMetricReporter;
    private reporter: PushgatewayMetricReporter;
    private internalCallback: () => Promise<any>;
    private scheduler: Scheduler;
    private schedulerSpy: SinonSpy;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.prometheusReporter = new PrometheusMetricReporter({
            clock: this.clock,
        });
        this.prometheusReporter.addMetricRegistry(this.registry);

        this.scheduler = (prog: () => Promise<any>, interval: number): NodeJS.Timer => {
            this.internalCallback = prog;
            return null;
        };
        this.schedulerSpy = spy(this.scheduler);

        this.reporter = new PushgatewayMetricReporter({
            host: "localhost",
            instance: "localhost",
            job: "test-pushgateway-reporter",
            port: 9091,
            reporter: this.prometheusReporter,
            scheduler: this.schedulerSpy,
        });
    }

    @test
    public async "check reporting with PrometheusMetricReporter"() {
        nock("http://localhost:9091")
            .put("/metrics/job/test-pushgateway-reporter/instance/localhost")
            .reply(202, "Accepted");

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

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        const payload = await this.internalCallback();
        expect(payload.result).to.be
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
    public async "check event reporting"() {
        nock("http://localhost:9091")
            .put(
                "/metrics/job/test-pushgateway-reporter/instance/localhost",
                "# HELP application_started application_started description\n" +
                "# TYPE application_started gauge\n" +
                "application_started" +
                "{application=\"my-web-app\",hostname=\"127.0.0.4\",mode=\"test\",customTag=\"specialValue\"} up\n",
            )
            .reply(202, "Accepted");

        const tags = new Map();
        tags.set("application", "my-web-app");
        tags.set("hostname", "127.0.0.4");
        tags.set("mode", "prod");

        this.prometheusReporter = new PrometheusMetricReporter({
            clock: this.clock,
        })
        .setTags(tags);

        this.reporter = new PushgatewayMetricReporter({
            host: "localhost",
            instance: "localhost",
            job: "test-pushgateway-reporter",
            port: 9091,
            reporter: this.prometheusReporter,
            scheduler: this.schedulerSpy,
        });

        expect(this.schedulerSpy).to.not.have.been.called;

        const event = new Event<string>("application_started")
            .setValue("up")
            .setTag("mode", "test")
            .setTag("customTag", "specialValue");

        await this.reporter.reportEvent(event);

        expect(this.schedulerSpy).to.not.have.been.called;
    }

}
