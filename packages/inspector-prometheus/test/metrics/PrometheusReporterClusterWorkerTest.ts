/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as sinonChai from "sinon-chai";

import {
    InterprocessMessage, MetricRegistry, MetricReporter,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import { InterprocessReportRequest, InterprocessReportResponse, PrometheusMetricReporter } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";
import { TestClusterOptions } from "./TestClusterOptions";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class PrometheusReporterClusterWorkerTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: PrometheusMetricReporter;
    private clusterOptions: TestClusterOptions;
    private getMetricsStringSpy: SinonSpy;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.clusterOptions = new TestClusterOptions(true, true, [], 1000),
        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
            clusterOptions: this.clusterOptions,
        }, "TestPrometheusMetricReporter");
        this.reporter.addMetricRegistry(this.registry);
        this.getMetricsStringSpy = spy(this.reporter.getMetricsString);
        this.reporter.getMetricsString = this.getMetricsStringSpy;
    }

    @test
    public async "check if ordinary report messages are ignored"() {
        const message: InterprocessMessage = {
            targetReporterType: "TestPrometheusMetricReporter",
            type: MetricReporter.MESSAGE_TYPE,
        };

        this.verifyMessageIsIgnored(message);
    }

    @test
    public async "check if wrong targetReporterType is ignored"() {
        const message: InterprocessMessage = {
            targetReporterType: "NotMatching",
            type: PrometheusMetricReporter.MESSAGE_TYPE_REQUEST,
        };

        this.verifyMessageIsIgnored(message);
    }

    @test
    public async "check if response messages are ignored"() {
        const message: InterprocessReportResponse = {
            id: "unexpected",
            metricsStr: "#empty",
            targetReporterType: "TestPrometheusMetricReporter",
            type: PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE,
        };

        this.verifyMessageIsIgnored(message);
    }

    @test
    public async "check if request messages are answered"() {
        const callback = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[1];

        const requestMessage: InterprocessReportRequest = {
            id: "messageId",
            targetReporterType: "TestPrometheusMetricReporter",
            type: PrometheusMetricReporter.MESSAGE_TYPE_REQUEST,
        };

        expect(this.clusterOptions.sendToMasterSpy).to.not.have.been.called;
        expect(this.getMetricsStringSpy).to.not.have.been.called;

        await callback(null /* worker */, requestMessage);

        expect(this.getMetricsStringSpy).to.have.been.called;
        expect(this.getMetricsStringSpy.callCount).to.equal(1);
        expect(this.clusterOptions.sendToMasterSpy).to.have.been.called;
        expect(this.clusterOptions.sendToMasterSpy.callCount).to.equal(1);

        const responseMessage = this.clusterOptions.sendToMasterSpy.getCall(0).args[0];
        expect(responseMessage).to.haveOwnProperty("metricsStr");
        expect(responseMessage.id).to.equal(requestMessage.id);
        expect(responseMessage.targetReporterType).to.equal("TestPrometheusMetricReporter");
        expect(responseMessage.type).to.equal(PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE);
    }

    protected verifyMessageIsIgnored(message: any) {
        expect(this.getMetricsStringSpy).to.not.have.been.called;
        expect(this.clusterOptions.eventReceiverOnSpy).to.have.been.called;
        expect(this.clusterOptions.eventReceiverOnSpy.callCount).to.equal(1);

        const messageType = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[0];
        const callback = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[1];

        expect(messageType).to.equal("message");
        expect(callback).to.exist;

        callback(null /* worker */, message);

        expect(this.getMetricsStringSpy).to.not.have.been.called;
    }

}
