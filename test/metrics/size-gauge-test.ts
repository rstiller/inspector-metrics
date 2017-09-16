import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { SizeGauge } from "../../lib/metrics/size-gauge";

const expect = chai.expect;

@suite
export class SizeGaugeTest {

    @test
    public "check length attribute"(): void {
        const arr: string[] = [];
        const gauge: SizeGauge = new SizeGauge("length-attribute", arr);
        expect(gauge.getValue()).to.equal(0);
        arr.push("test");
        expect(gauge.getValue()).to.equal(1);
        arr.splice(0, 1);
        expect(gauge.getValue()).to.equal(0);
    }

    @test
    public "check length method"(): void {
        const arr: string[] = [];
        const gauge: SizeGauge = new SizeGauge("length-method", {
            size: () => arr.length,
        });
        expect(gauge.getValue()).to.equal(0);
        arr.push("test");
        expect(gauge.getValue()).to.equal(1);
        arr.splice(0, 1);
        expect(gauge.getValue()).to.equal(0);
    }

    @test
    public "check size attribute"(): void {
        const map = new Map();
        const gauge: SizeGauge = new SizeGauge("size-attribute", map);
        expect(gauge.getValue()).to.equal(0);
        map.set("key", "value");
        expect(gauge.getValue()).to.equal(1);
        map.delete("key");
        expect(gauge.getValue()).to.equal(0);
    }

    @test
    public "check size method"(): void {
        const map = new Map();
        const gauge: SizeGauge = new SizeGauge("size-method", {
            size: () => map.size,
        });
        expect(gauge.getValue()).to.equal(0);
        map.set("key", "value");
        expect(gauge.getValue()).to.equal(1);
        map.delete("key");
        expect(gauge.getValue()).to.equal(0);
    }

}
