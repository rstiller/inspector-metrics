/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as sinonChai from "sinon-chai";

import {
    Counter,
    DefaultReservoir,
    Histogram,
    InterprocessReportMessage,
    Meter,
    MetricReporter,
    MonotoneCounter,
    ReportingResult,
    SerializableMetric,
    SimpleGauge,
    Tags,
    Timer,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import { AbstractReportTest } from "./AbstractReporterTest";
import { TestClusterOptions } from "./TestClusterOptions";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class CsvReporterSerializationTest extends AbstractReportTest {

    private clusterOptions: TestClusterOptions;
    private handleResultSpy: SinonSpy;

    public before() {
        super.before();
        this.clusterOptions = new TestClusterOptions(true, false, []),
        this.reporter = this.newReporter({
            clusterOptions: this.clusterOptions,
            columns: ["date", "group", "name", "field", "value", "type", "description", "metadata", "tags"],
            writer: this.writer,
        });
        this.reporter.addMetricRegistry(this.registry);
        this.handleResultSpy = spy((this.reporter as any).handleResults);
        (this.reporter as any).handleResults = this.handleResultSpy;
    }

    @test
    public async "check serialization of tags, metadata and metric fields"() {
        const counter = new Counter("counter1")
            .setMetadata("hostname", "server1")
            .setTag("typeXY", "abcde");
        const serializedCounter = JSON.parse(JSON.stringify(counter));
        const monotoneCounter = new MonotoneCounter("monotoneCounter1")
            .setMetadata("hostname", "server3");
        const serializedMonotoneCounter = JSON.parse(JSON.stringify(monotoneCounter));
        const gauge = new SimpleGauge("gauge1")
            .setTag("hostname", "server2")
            .setValue(123);
        const serializedGauge = JSON.parse(JSON.stringify(gauge));
        const histogram = new Histogram(new DefaultReservoir(3), "histogram1");
        const serializedHistogram = JSON.parse(JSON.stringify(histogram));
        const meter = new Meter(this.clock, 1, "meter1");
        const serializedMeter = JSON.parse(JSON.stringify(meter));
        const timer = new Timer(this.clock, new DefaultReservoir(3), "timer1");
        const serializedTimer = JSON.parse(JSON.stringify(timer));

        await this.callWithMetrics(
            {
                hostname: "server1",
            },
            [{
                metric: serializedCounter,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportCounter(counter, null))),
            }],
            [{
                metric: serializedGauge,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportGauge(gauge, null))),
            }],
            [{
                metric: serializedHistogram,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportHistogram(histogram, null))),
            }],
            [{
                metric: serializedMeter,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportMeter(meter, null))),
            }],
            [{
                metric: serializedMonotoneCounter,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportCounter(monotoneCounter, null))),
            }],
            [{
                metric: serializedTimer,
                result: JSON.parse(JSON.stringify(await (this.reporter as any).reportTimer(timer, null))),
            }],
        );

        this.verifyWriteCall(serializedMonotoneCounter, ["19700101000000.000+00:00", "\"\"", "\"monotoneCounter1\"",
            "\"count\"", "0", "\"counter\"", "\"\"", "hostname=\"server3\"", "hostname=\"server1\""], 0);

        this.verifyWriteCall(serializedCounter, ["19700101000000.000+00:00", "\"\"", "\"counter1\"", "\"count\"", "0",
            "\"counter\"", "\"\"", "hostname=\"server1\"", "hostname=\"server1\";typeXY=\"abcde\""], 1);

        this.verifyWriteCall(serializedGauge, ["19700101000000.000+00:00", "\"\"", "\"gauge1\"", "\"value\"", "123",
            "\"gauge\"", "\"\"", "", "hostname=\"server2\""], 2);

        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.005\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 3);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.01\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 4);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.025\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 5);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.05\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 6);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.1\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 7);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.25\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 8);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_0.5\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 9);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_1\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 10);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_2.5\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 11);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_5\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 12);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_10\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 13);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"",
            "\"bucket_inf\"", "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 14);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"count\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 15);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"max\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 16);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"mean\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 17);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"min\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 18);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p50\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 19);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p75\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 20);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p95\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 21);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p98\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 22);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p99\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 23);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"p999\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 24);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"stddev\"",
            "0", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 25);
        this.verifyWriteCall(serializedHistogram, ["19700101000000.000+00:00", "\"\"", "\"histogram1\"", "\"sum\"",
            "", "\"histogram\"", "\"\"", "", "hostname=\"server1\""], 26);

        this.verifyWriteCall(serializedMeter, ["19700101000000.000+00:00", "\"\"", "\"meter1\"", "\"count\"", "0",
            "\"meter\"", "\"\"", "", "hostname=\"server1\""], 27);
        this.verifyWriteCall(serializedMeter, ["19700101000000.000+00:00", "\"\"", "\"meter1\"", "\"m15_rate\"", "0",
            "\"meter\"", "\"\"", "", "hostname=\"server1\""], 28);
        this.verifyWriteCall(serializedMeter, ["19700101000000.000+00:00", "\"\"", "\"meter1\"", "\"m1_rate\"", "0",
            "\"meter\"", "\"\"", "", "hostname=\"server1\""], 29);
        this.verifyWriteCall(serializedMeter, ["19700101000000.000+00:00", "\"\"", "\"meter1\"", "\"m5_rate\"", "0",
            "\"meter\"", "\"\"", "", "hostname=\"server1\""], 30);
        this.verifyWriteCall(serializedMeter, ["19700101000000.000+00:00", "\"\"", "\"meter1\"", "\"mean_rate\"", "0",
            "\"meter\"", "\"\"", "", "hostname=\"server1\""], 31);

        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.005\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 32);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.01\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 33);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.025\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 34);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.05\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 35);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.1\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 36);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.25\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 37);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_0.5\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 38);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_1\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 39);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_2.5\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 40);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_5\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 41);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_10\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 42);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"",
            "\"bucket_inf\"", "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 43);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"count\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 44);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"m15_rate\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 45);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"m1_rate\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 46);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"m5_rate\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 47);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"max\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 48);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"mean\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 49);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"mean_rate\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 50);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"min\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 51);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p50\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 52);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p75\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 53);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p95\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 54);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p98\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 55);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p99\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 56);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"p999\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 57);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"stddev\"",
            "0", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 58);
        this.verifyWriteCall(serializedTimer, ["19700101000000.000+00:00", "\"\"", "\"timer1\"", "\"sum\"",
            "", "\"timer\"", "\"\"", "", "hostname=\"server1\""], 59);

        const calls = this.writeRowSpy.getCalls();
        expect(calls.length).to.equal(60);
    }

    protected async callWithMetrics(
        tags: Tags,
        counters: Array<ReportingResult<SerializableMetric, any>> = [],
        gauges: Array<ReportingResult<SerializableMetric, any>> = [],
        histograms: Array<ReportingResult<SerializableMetric, any>> = [],
        meters: Array<ReportingResult<SerializableMetric, any>> = [],
        monotoneCounters: Array<ReportingResult<SerializableMetric, any>> = [],
        timers: Array<ReportingResult<SerializableMetric, any>> = [],
    ) {
        const date = new Date(this.clock.time().milliseconds);
        const message: InterprocessReportMessage<any> = {
            ctx: {},
            date,
            metrics: {
                counters,
                gauges,
                histograms,
                meters,
                monotoneCounters,
                timers,
            },
            tags,
            targetReporterType: "TestMetricReporter",
            type: MetricReporter.MESSAGE_TYPE,
        };

        expect(this.handleResultSpy).to.not.have.been.called;

        await this.callWithMessage(message);

        this.verifyInitCall(["date", "group", "name", "field", "value", "type", "description", "metadata", "tags"]);
    }

    protected async callWithMessage(message: any) {
        expect(this.clusterOptions.eventReceiverOnSpy).to.have.been.called;
        expect(this.clusterOptions.eventReceiverOnSpy.callCount).to.equal(1);

        const messageType = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[0];
        const callback = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[1];

        expect(messageType).to.equal("message");
        expect(callback).to.exist;

        await callback(null /* worker */, message);
    }

}
