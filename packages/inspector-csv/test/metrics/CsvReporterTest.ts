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
import { CsvFileWriter, CsvMetricReporter, CsvMetricReporterOptions, ExportMode } from "../../lib/metrics";
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

    @test
    public async "check reporting with empty metric registry and tags in columns, but no tags assigned"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        await this.triggerReporting();

        this.verifyInitCall("/tmp", "metrics.csv", ["date", "group", "name", "field", "value", "tags"]);
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with empty metric registry and tags in one column"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        const tags = new Map();
        tags.set("app", "test-app");
        tags.set("version", "1.0.0");
        this.reporter.setTags(tags);

        await this.triggerReporting();

        this.verifyInitCall("/tmp", "metrics.csv", ["date", "group", "name", "field", "value", "tags"]);
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with empty metric registry and tags in separate columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        const tags = new Map();
        tags.set("app", "test-app");
        tags.set("version", "1.0.0");
        this.reporter.setTags(tags);

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "tag_app", "tag_version"],
        );
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with tags in separate columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        const tags = new Map();
        tags.set("app", "test-app");
        tags.set("version", "1.0.0");
        this.reporter.setTags(tags);

        this.registry.newCounter("test_counter");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "tag_app", "tag_version"],
        );
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with tags in separate columns as superset of all metrics"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        const tags = new Map();
        tags.set("app", "test-app");
        tags.set("version", "1.0.0");
        this.reporter.setTags(tags);

        this.registry.newCounter("test_counter_1")
            .setTag("type", "requests_per_second");

        this.registry.newCounter("test_counter_2")
            .setTag("measurement", "iops");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "tag_app", "tag_version", "tag_type", "tag_measurement"],
        );
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
