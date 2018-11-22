// tslint:disable:no-unused-expression
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Meter } from "../../lib/metrics/meter";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite
export class MeterTest {

    private clock: MockedClock = new MockedClock();

    @test
    public "check name and description"(): void {
        let meter: Meter = new Meter(this.clock, 1);
        expect(meter.getName()).to.be.undefined;
        expect(meter.getDescription()).to.be.undefined;

        meter = new Meter(this.clock, 1, "meter-name");
        expect(meter.getName()).to.equal("meter-name");
        expect(meter.getDescription()).to.be.undefined;

        meter = new Meter(this.clock, 1, "meter-name", "meter-description");
        expect(meter.getName()).to.equal("meter-name");
        expect(meter.getDescription()).to.equal("meter-description");
    }

    @test
    public "single mark and check rates with no tick"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter.mark(1);
        expect(meter.getCount()).to.equal(1);
        expect(meter.getMeanRate()).to.equal(Infinity);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);
    }

    @test
    public "mark using fluent interface"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter
            .mark(1)
            .mark(2)
            .mark(3)
            .mark(4);

        expect(meter.getCount()).to.equal(10);
        expect(meter.getMeanRate()).to.equal(Infinity);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);
    }

    @test
    public "mark and tick and check rates"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter.mark(1);
        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(1);
        expect(meter.getMeanRate()).to.be.lessThan(1);
        expect(meter.get1MinuteRate()).to.be.equal(1);
        expect(meter.get5MinuteRate()).to.be.equal(1);
        expect(meter.get15MinuteRate()).to.be.equal(1);
    }

    @test
    public "multi mark and tick and check rates"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter.mark(1);
        meter.mark(3);
        meter.mark(5);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(9);
        expect(meter.getMeanRate()).to.be.lessThan(9);
        expect(meter.get1MinuteRate()).to.be.equal(9);
        expect(meter.get5MinuteRate()).to.be.equal(9);
        expect(meter.get15MinuteRate()).to.be.equal(9);
    }

    @test
    public "mark and multi tick and check rates withing same rate-interval"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter.mark(10);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(10);
        expect(meter.getMeanRate()).to.be.lessThan(10);
        expect(meter.get1MinuteRate()).to.be.equal(10);
        expect(meter.get5MinuteRate()).to.be.equal(10);
        expect(meter.get15MinuteRate()).to.be.equal(10);

        meter.mark(20);

        this.clock.setCurrentTime({
            milliseconds: 2001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(30);
        expect(meter.getMeanRate()).to.be.lessThan(15);
        expect(meter.getMeanRate()).to.be.greaterThan(10);
        expect(meter.get1MinuteRate()).to.be.equal(10);
        expect(meter.get5MinuteRate()).to.be.equal(10);
        expect(meter.get15MinuteRate()).to.be.equal(10);
    }

    @test
    public "mark and multi tick and check rates within different rate-intervals"(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const meter = new Meter(this.clock, 1);

        expect(meter.getCount()).to.equal(0);
        expect(meter.getMeanRate()).to.equal(0);
        expect(meter.get1MinuteRate()).to.equal(0);
        expect(meter.get5MinuteRate()).to.equal(0);
        expect(meter.get15MinuteRate()).to.equal(0);

        meter.mark(10);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(10);
        expect(meter.getMeanRate()).to.be.lessThan(10);
        expect(meter.get1MinuteRate()).to.be.equal(10);
        expect(meter.get5MinuteRate()).to.be.equal(10);
        expect(meter.get15MinuteRate()).to.be.equal(10);

        meter.mark(80);

        this.clock.setCurrentTime({
            milliseconds: 5001,
            nanoseconds: 0,
        });

        expect(meter.getCount()).to.equal(90);
        expect(meter.getMeanRate()).to.be.lessThan(18);
        expect(meter.getMeanRate()).to.be.greaterThan(17);
        expect(meter.get1MinuteRate()).to.be.lessThan(11);
        expect(meter.get1MinuteRate()).to.be.greaterThan(10);
        expect(meter.get5MinuteRate()).to.be.lessThan(11);
        expect(meter.get5MinuteRate()).to.be.greaterThan(10);
        expect(meter.get15MinuteRate()).to.be.lessThan(11);
        expect(meter.get15MinuteRate()).to.be.greaterThan(10);
    }

}
