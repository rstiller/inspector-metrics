import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { SimpleGauge } from "../../lib/metrics/gauge";

const expect = chai.expect;

@suite
export class SimpleGaugeTest {

    @test
    public "check set and get value"(): void {
        const gauge: SimpleGauge = new SimpleGauge();
        expect(gauge.getValue()).to.equal(0);
        gauge.setValue(1);
        expect(gauge.getValue()).to.equal(1);
    }

}
