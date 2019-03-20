/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import {
    Clock,
    InterprocessReportMessage,
    InterprocessReportMessageSender,
    Logger,
    LoggerReporter,
    MetricRegistry,
    MetricReporter,
    MILLISECOND,
    ReportingResult,
    Scheduler,
    Time,
} from "../../../lib/metrics";

chai.use(sinonChai);

const expect = chai.expect;

export class MockedLogger implements Logger {
    public log(...args: any[]): void {}
    public error(...args: any[]): void {}
    public warn(...args: any[]): void {}
    public info(...args: any[]): void {}
    public debug(...args: any[]): void {}
    public trace(...args: any[]): void {}
}

export class MockedClock implements Clock {

    private currentTime: Time;

    public time(): Time {
        return this.currentTime;
    }

    public setCurrentTime(time: Time): void {
        this.currentTime = time;
    }

}

@suite
export class LoggerReporterClusterWorkerTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private logger: Logger;
    private loggerSpy: SinonSpy;
    private internalCallback: () => Promise<any>;
    private scheduler: Scheduler;
    private schedulerSpy: SinonSpy;
    private interprocessReportMessageSender: InterprocessReportMessageSender;
    private interprocessReportMessageSenderSpy: SinonSpy;
    private reporter: LoggerReporter;

    public before(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });

        this.registry = new MetricRegistry();
        this.logger = new MockedLogger();
        this.loggerSpy = spy(this.logger.info);
        this.logger.info = this.loggerSpy;
        this.scheduler = (prog: () => Promise<any>, interval: number): NodeJS.Timer => {
            this.internalCallback = prog;
            return null;
        };
        this.schedulerSpy = spy(this.scheduler);
        this.interprocessReportMessageSender = (message: InterprocessReportMessage<any>) => {};
        this.interprocessReportMessageSenderSpy = spy(this.interprocessReportMessageSender);
        this.reporter = new LoggerReporter({
            clock: this.clock,
            interprocessReportMessageSender: this.interprocessReportMessageSenderSpy,
            log: this.logger,
            minReportingTimeout: 1,
            reportInterval: 1000,
            scheduler: this.schedulerSpy,
            sendMetricsToMaster: true,
            tags: new Map(),
            unit: MILLISECOND,
        });

        this.registry.setDefaultClock(this.clock);
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public async "send metrics to master process"() {
        this.registry.newCounter("counter1");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.interprocessReportMessageSenderSpy.callCount).to.equal(1);

        let interprocessReportMessage = this.interprocessReportMessageSenderSpy.getCall(0).args[0];
        // simulating the serialization
        interprocessReportMessage = JSON.parse(JSON.stringify(interprocessReportMessage));

        expect(interprocessReportMessage).to.have.property("ctx");
        expect(interprocessReportMessage).to.have.property("date");
        expect(interprocessReportMessage).to.have.property("metrics");
        expect(interprocessReportMessage).to.have.property("tags");
        expect(interprocessReportMessage).to.have.property("targetReporterType");
        expect(interprocessReportMessage).to.have.property("type");

        expect(interprocessReportMessage.type).to.equal(MetricReporter.MESSAGE_TYPE);
        expect(interprocessReportMessage.targetReporterType).to.equal("LoggerReporter");

        const metrics = interprocessReportMessage.metrics;
        expect(metrics).to.have.property("counters");
        expect(metrics).to.have.property("gauges");
        expect(metrics).to.have.property("histograms");
        expect(metrics).to.have.property("meters");
        expect(metrics).to.have.property("monotoneCounters");
        expect(metrics).to.have.property("timers");

        const counters = metrics.counters;
        expect(counters).to.have.length(1);

        const result: ReportingResult<any, any> = counters[0];
        expect(result.metric.name).to.equal("counter1");
        expect(result.metric.count).to.equal(0);
        expect(result.result.message).to.match(/Thu Jan 01 1970 01\:00\:00 GMT\+0100 \(.*\) - counter counter1\: 0/g);
        expect(result.result.metadata.reportInterval).to.equal(1000);
        expect(result.result.metadata.measurement).to.equal("counter1");
        expect(result.result.metadata.measurement_type).to.equal("counter");
        expect(result.result.metadata.timestamp).to.equal("1970-01-01T00:00:00.000Z");
    }

    @test
    public async "check registry tags send to master"() {
        this.registry.newCounter("counter1");
        this.registry.setTag("tag1", "value1");
        this.registry.setTag("tag2", "value2");

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.loggerSpy).to.not.have.been.called;
        expect(this.interprocessReportMessageSenderSpy.callCount).to.equal(1);

        let interprocessReportMessage = this.interprocessReportMessageSenderSpy.getCall(0).args[0];
        // simulating the serialization
        interprocessReportMessage = JSON.parse(JSON.stringify(interprocessReportMessage));

        expect(interprocessReportMessage).to.have.property("tags");

        expect(interprocessReportMessage.tags.tag1).to.equal("value1");
        expect(interprocessReportMessage.tags.tag2).to.equal("value2");
    }

}
