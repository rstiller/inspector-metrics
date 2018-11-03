/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import {
    Clock,
    Logger,
    LoggerReporter,
    MetricRegistry,
    MILLISECOND,
    Scheduler,
    SimpleGauge,
    Time,
} from "../../../lib/metrics/";

chai.use(sinonChai);

const expect = chai.expect;

export class MockedLogger implements Logger {
    public calls: any[] = [];

    public log(): void {}
    public error(): void {}
    public warn(): void {}
    public info(msg: string, metadata: any): void {
        this.calls.push(Object.assign({}, metadata));
    }
    public debug(): void {}
    public trace(): void {}
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
export class LoggerReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private logger: MockedLogger;
    private internalCallback: () => Promise<void>;
    private scheduler: Scheduler;
    private schedulerSpy: SinonSpy;
    private reporter: LoggerReporter;

    public before(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });

        this.registry = new MetricRegistry();
        this.logger = new MockedLogger();
        this.scheduler = (prog: () => Promise<void>, interval: number): NodeJS.Timer => {
            this.internalCallback = prog;
            return null;
        };
        this.schedulerSpy = spy(this.scheduler);
        this.reporter = new LoggerReporter({
            clock: this.clock,
            log: this.logger,
            reportInterval: 1000,
            scheduler: this.schedulerSpy,
            tags: new Map(),
            unit: MILLISECOND,
        });

        this.registry.setDefaultClock(this.clock);
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public async "report multiple metric with same name"() {
        const gauge1 = new SimpleGauge("myValue");
        const gauge2 = new SimpleGauge("myValue");

        gauge1.setTag("type", "abc");
        gauge2.setTag("type", "def");

        this.registry.registerMetric(gauge1);
        this.registry.registerMetric(gauge2);

        const metrics = this.registry.getMetricList();
        expect(metrics).to.have.length(2);
        expect(metrics[0]).to.equal(gauge1);
        expect(metrics[1]).to.equal(gauge2);

        expect(this.schedulerSpy).to.not.have.been.called;

        await this.reporter.start();

        expect(this.schedulerSpy).to.have.been.called;

        await this.internalCallback();

        expect(this.logger.calls.length).to.equal(2);

        let logMetadata = this.logger.calls[0];
        expect(logMetadata.measurement).to.equal("myValue");
        expect(logMetadata.measurement_type).to.equal("gauge");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags["type"]).to.equal("abc");

        logMetadata = this.logger.calls[1];
        expect(logMetadata.measurement).to.equal("myValue");
        expect(logMetadata.measurement_type).to.equal("gauge");
        expect(logMetadata.timestamp.getTime()).to.equal(0);
        expect(logMetadata.tags["type"]).to.equal("def");
    }

}
