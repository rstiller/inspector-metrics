import "reflect-metadata";
import "source-map-support/register";

// import * as chai from "chai";
import { suite, test } from "mocha-typescript";

// const expect = chai.expect;

@suite("VMMetricsReporter")
export class VMMetricsReporterTest {

    @test("nothing")
    public checkNothing(): void {
    }

}
