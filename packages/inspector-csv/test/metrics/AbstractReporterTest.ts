/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import {
    Metric, MetricRegistry,
} from "inspector-metrics";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";
import { CsvFileWriter, CsvMetricReporter, CsvMetricReporterOptions, Row } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

chai.use(sinonChai);

const expect = chai.expect;

export class AbstractReportTest {

    protected internalCallback: () => void;
    protected clock: MockedClock = new MockedClock();
    protected registry: MetricRegistry;
    protected reporter: CsvMetricReporter;
    protected initSpy: SinonSpy;
    protected writeRowSpy: SinonSpy;
    protected writer: CsvFileWriter;

    public before() {
        this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 });
        this.registry = new MetricRegistry();
        this.initSpy = spy();
        this.writeRowSpy = spy();
        this.writer = {
            init: this.initSpy,
            writeRow: this.writeRowSpy,
        };
        this.reporter = this.newReporter();
        this.reporter.addMetricRegistry(this.registry);
    }

    protected newReporter(options = new CsvMetricReporterOptions({ writer: this.writer })): CsvMetricReporter {
        return new CsvMetricReporter(options, new Map(), this.clock, 1, (task, interval) => {
            this.internalCallback = task;
            return null;
        });
    }

    protected async triggerReporting() {
        expect(this.initSpy).to.have.not.been.called;
        expect(this.writeRowSpy).to.have.not.been.called;
        expect(this.internalCallback).to.not.exist;

        await this.reporter.start();

        expect(this.internalCallback).to.exist;

        await this.internalCallback();
    }

    protected verifyInitCall(dir: string, filename: string, columns: string[], call = 0) {
        expect(this.initSpy).to.have.been.called;
        const calls = this.initSpy.getCalls();
        expect(calls.length).to.be.gte(call + 1);
        expect(calls[call].args[0]).to.be.equal(dir);
        expect(calls[call].args[1]).to.be.equal(filename);
        expect(calls[call].args[2]).to.deep.equal(columns);
    }

    protected verifyWriteCall<T extends Metric>(metric: T, row: Row, call = 0) {
        expect(this.initSpy).to.have.been.called;
        const calls = this.writeRowSpy.getCalls();
        expect(calls.length).to.be.gte(call + 1);
        expect(calls[call].args[0]).to.be.equal(metric);
        expect(calls[call].args[1]).to.deep.equal(row);
    }
}
