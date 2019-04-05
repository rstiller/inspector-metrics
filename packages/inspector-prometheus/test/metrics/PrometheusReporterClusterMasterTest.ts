/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { EventEmitter } from "events";
import {
    InterprocessReportMessage,
    MetricRegistry,
    MetricReporter,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { PrometheusMetricReporter } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite
export class PrometheusReporterTest {

    private eventEmitter: EventEmitter;
    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: PrometheusMetricReporter;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.eventEmitter = new EventEmitter();
        this.reporter = new PrometheusMetricReporter({
            clock: this.clock,
        }, "TestPrometheusMetricReporter");
        this.reporter.addMetricRegistry(this.registry);
    }

    @test
    public "check report messages are ignored"(done: (err?: any) => any) {
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
            targetReporterType: "TestPrometheusMetricReporter",
            type: MetricReporter.MESSAGE_TYPE,
        };

        this.eventEmitter.emit("message", null /* worker */, message);

        setImmediate(() => {
            expect(message.ctx.result).to.equal("");

            done();
        });
    }

}
