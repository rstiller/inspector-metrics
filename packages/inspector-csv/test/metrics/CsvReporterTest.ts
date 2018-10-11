/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import * as sinonChai from "sinon-chai";
import { CsvMetricReporterOptions } from "../../lib/metrics";
import { AbstractReportTest } from "./AbstractReporterTest";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class CsvReporterTest extends AbstractReportTest {

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

}
