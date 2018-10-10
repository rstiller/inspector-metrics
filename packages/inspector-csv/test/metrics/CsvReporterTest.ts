/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import {
    MetricRegistry,
} from "inspector-metrics";
import { suite, test } from "mocha-typescript";
import { SinonSpy, spy } from "sinon";
import * as sinonChai from "sinon-chai";
import { CsvFileWriter, CsvMetricReporter, CsvMetricReporterOptions } from "../../lib/metrics";
import { MockedClock } from "./mocked-clock";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class CsvReporterTest {

    private clock: MockedClock = new MockedClock();
    private registry: MetricRegistry;
    private reporter: CsvMetricReporter;
    private initSpy: SinonSpy;
    private writeRowSpy: SinonSpy;
    private internalCallback: () => void;
    private writer: CsvFileWriter;

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

    @test
    public async "check reporting without metric registries and default values"() {
        this.reporter.removeMetricRegistry(this.registry);

        await this.triggerReporting();

        expect(this.initSpy).to.have.not.been.called;
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with empty metric registry and default values"() {
        await this.triggerReporting();

        this.verifyInitCall("/tmp", "metrics.csv", []);
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with empty metric registry and some columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value"],
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        await this.triggerReporting();

        this.verifyInitCall("/tmp", "metrics.csv", ["date", "group", "name", "field", "value"]);
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    private newReporter(options = new CsvMetricReporterOptions({ writer: this.writer })): CsvMetricReporter {
        return new CsvMetricReporter(options, new Map(), this.clock, 1, (task, interval) => {
            this.internalCallback = task;
            return null;
        });
    }

    private async triggerReporting() {
        expect(this.initSpy).to.have.not.been.called;
        expect(this.writeRowSpy).to.have.not.been.called;
        expect(this.internalCallback).to.not.exist;

        this.reporter.start();

        expect(this.internalCallback).to.exist;

        await this.internalCallback();
    }

    private verifyInitCall(dir: string, filename: string, columns: string[], call = 0) {
        expect(this.initSpy).to.have.been.called;
        const calls = this.initSpy.getCalls();
        expect(calls).to.have.lengthOf(1);
        expect(calls[call].args[0]).to.be.equal(dir);
        expect(calls[call].args[1]).to.be.equal(filename);
        expect(calls[call].args[2]).to.deep.equal(columns);
    }

}
