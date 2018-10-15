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
export class CsvReporterMetadataTest extends AbstractReportTest {

    @test
    public async "check reporting with empty metric registry and metadata in columns, but no metadata assigned"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "metadata"],
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);

        await this.triggerReporting();

        this.verifyInitCall("/tmp", "metrics.csv", ["date", "group", "name", "field", "value", "metadata"]);
        expect(this.writeRowSpy).to.have.not.been.called;
    }

    @test
    public async "check reporting with metadata in separate columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "metadata"],
            metadataExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);
        const counter = this.registry.newCounter("test_counter");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value"],
        );
        this.verifyWriteCall(
            counter,
            ["19700101010000.000+01:00", "\"\"", "\"test_counter\"", "\"count\"", "0"],
        );
    }

    @test
    public async "check reporting with metadata in separate columns as superset of all metrics"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "metadata"],
            metadataExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);
        const counter1 = this.registry.newCounter("test_counter_1");
        counter1.setMetadata("type", "requests_per_second");

        const counter2 = this.registry.newCounter("test_counter_2");
        counter2.setMetadata("measurement", "iops");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "meta_type", "meta_measurement"],
        );
        this.verifyWriteCall(
            counter1,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_1\"",
                "\"count\"",
                "0",
                "\"requests_per_second\"",
                "\"\"",
            ],
        );
        this.verifyWriteCall(
            counter2,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_2\"",
                "\"count\"",
                "0",
                "\"\"",
                "\"iops\"",
            ],
            1,
        );
    }

    @test
    public async "check reporting with custom metadata prefix"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "metadata"],
            metadataColumnPrefix: "m_",
            metadataExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);
        const counter1 = this.registry.newCounter("test_counter_1");
        counter1.setMetadata("type", "requests_per_second");

        const counter2 = this.registry.newCounter("test_counter_2");
        counter2.setMetadata("measurement", "iops");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "m_type", "m_measurement"],
        );
        this.verifyWriteCall(
            counter1,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_1\"",
                "\"count\"",
                "0",
                "\"requests_per_second\"",
                "\"\"",
            ],
        );
        this.verifyWriteCall(
            counter2,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_2\"",
                "\"count\"",
                "0",
                "\"\"",
                "\"iops\"",
            ],
            1,
        );
    }

    @test
    public async "check metadata filtering in columns"() {
        this.reporter = this.newReporter(new CsvMetricReporterOptions({
            columns: ["date", "group", "name", "field", "value", "metadata"],
            metadataExportMode: ExportMode.EACH_IN_OWN_COLUMN,
            metadataFilter: async (metric, metadata, value) => metadata !== "type",
            writer: this.writer,
        }));
        this.reporter.addMetricRegistry(this.registry);
        const counter1 = this.registry.newCounter("test_counter_1");
        counter1.setMetadata("type", "requests_per_second");

        const counter2 = this.registry.newCounter("test_counter_2");
        counter2.setMetadata("measurement", "iops");

        await this.triggerReporting();

        this.verifyInitCall(
            "/tmp",
            "metrics.csv",
            ["date", "group", "name", "field", "value", "meta_measurement"],
        );
        this.verifyWriteCall(
            counter1,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_1\"",
                "\"count\"",
                "0",
                "\"\"",
            ],
        );
        this.verifyWriteCall(
            counter2,
            [
                "19700101010000.000+01:00",
                "\"\"",
                "\"test_counter_2\"",
                "\"count\"",
                "0",
                "\"iops\"",
            ],
            1,
        );
    }

}
