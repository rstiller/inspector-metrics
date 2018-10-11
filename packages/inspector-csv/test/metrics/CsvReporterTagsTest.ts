/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import * as sinonChai from "sinon-chai";
import { CsvMetricReporterOptions, ExportMode } from "../../lib/metrics";
import { AbstractReportTest } from "./AbstractReporterTest";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class CsvReporterTagsTest extends AbstractReportTest {

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

    @test
    public async "check reporting with custom tag prefix"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            tagColumnPrefix: "t_",
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
            ["date", "group", "name", "field", "value", "t_app", "t_version", "t_type", "t_measurement"],
        );
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check tag filtering in columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "tags"],
            tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            tagFilter: async (metric, tag, value) => tag !== "version",
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
            ["date", "group", "name", "field", "value", "tag_app", "tag_type", "tag_measurement"],
        );
        expect(this.writeRowSpy).to.have.not.been.called;
    }

}
