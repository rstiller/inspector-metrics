/* eslint-env mocha */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";

import { EventEmitter } from "events";
import {
    InterprocessReportMessage,
    Logger,
    LoggerReporter,
    MetricReporter,
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

@suite
export class LoggerReporterClusterMasterTest {

    private eventEmitter: EventEmitter;
    private logger: Logger;
    private loggerSpy: SinonSpy;

    public before() {
        this.eventEmitter = new EventEmitter();
        this.logger = new MockedLogger();
        this.loggerSpy = spy(this.logger.info);
        this.logger.info = this.loggerSpy;
        new LoggerReporter({
            clusterOptions: {
                enabled: true,
                eventReceiver: this.eventEmitter,
                getWorkers: async () => [],
                sendMetricsToMaster: false,
                sendToMaster: async () => null,
                sendToWorker: async () => null,
            },
            log: this.logger,
        }, "TestLoggerReportType");
    }

    @test
    public "check master receives metric report messages"(done: (err?: any) => any) {
        const message: InterprocessReportMessage<any> = {
            ctx: {},
            date: new Date(),
            metrics: {
                counters: [{
                    metric: null,
                    result: {
                        message: `${new Date()} counter1: 0`,
                        metadata: {
                            hostname: "server1",
                        },
                    },
                }],
                gauges: [],
                histograms: [],
                meters: [],
                monotoneCounters: [],
                timers: [],
            },
            tags: null,
            targetReporterType: "TestLoggerReportType",
            type: MetricReporter.MESSAGE_TYPE,
        };

        expect(this.loggerSpy).to.not.have.been.called;

        this.eventEmitter.emit("message", null /* worker */, message);

        setImmediate(() => {
            try {
                expect(this.loggerSpy).to.have.been.called;
            } catch (err) {
                console.log(err);
            }

            const logMessage = this.loggerSpy.getCall(0).args[0];
            const logMetadata = this.loggerSpy.getCall(0).args[1];

            expect(logMessage).to.equal(message.metrics.counters[0].result.message);
            expect(logMetadata).to.deep.equal(message.metrics.counters[0].result.metadata);

            done();
        });
    }

    @test
    public "check master does not handle metric report messages from other reporters"(done: (err?: any) => any) {
        const message: InterprocessReportMessage<any> = {
            ctx: {},
            date: new Date(),
            metrics: {
                counters: [{
                    metric: null,
                    result: {
                        message: `${new Date()} counter1: 0`,
                        metadata: {
                            hostname: "server1",
                        },
                    },
                }],
                gauges: [],
                histograms: [],
                meters: [],
                monotoneCounters: [],
                timers: [],
            },
            tags: null,
            targetReporterType: "NotTheSameLoggerImplementation",
            type: MetricReporter.MESSAGE_TYPE,
        };

        expect(this.loggerSpy).to.not.have.been.called;

        this.eventEmitter.emit("message", null /* worker */, message);

        setImmediate(() => {
            expect(this.loggerSpy).to.not.have.been.called;
            done();
        });
    }

    @test
    public "check master does not handle metric report messages if clustering disabled"(done: (err?: any) => any) {
        const message: InterprocessReportMessage<any> = {
            ctx: {},
            date: new Date(),
            metrics: {
                counters: [{
                    metric: null,
                    result: {
                        message: `${new Date()} counter1: 0`,
                        metadata: {
                            hostname: "server1",
                        },
                    },
                }],
                gauges: [],
                histograms: [],
                meters: [],
                monotoneCounters: [],
                timers: [],
            },
            tags: null,
            targetReporterType: "TestLoggerReportType",
            type: MetricReporter.MESSAGE_TYPE,
        };

        this.logger = new MockedLogger();
        this.loggerSpy = spy(this.logger.info);
        this.logger.info = this.loggerSpy;
        new LoggerReporter({
            clusterOptions: {
                enabled: false,
                eventReceiver: this.eventEmitter,
                getWorkers: async () => [],
                sendMetricsToMaster: false,
                sendToMaster: async () => null,
                sendToWorker: async () => null,
            },
            log: this.logger,
        }, "TestLoggerReportType");

        expect(this.loggerSpy).to.not.have.been.called;

        this.eventEmitter.emit("message", null /* worker */, message);

        setImmediate(() => {
            expect(this.loggerSpy).to.not.have.been.called;
            done();
        });
    }

}
