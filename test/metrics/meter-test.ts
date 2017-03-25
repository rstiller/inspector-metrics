
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Meter } from "../../lib/metrics/meter";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite("Meter")
export class MeterTest {

    private clock: MockedClock = new MockedClock();

    @test("single mark and check rates with no tick")
    public singleMarkAndCheckRatesWithNoTick(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        let meter = new Meter(this.clock, 1);

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

    @test("mark and tick and check rates")
    public markAndTickAndCheckRates(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        let meter = new Meter(this.clock, 1);

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

    @test("multi mark and tick and check rates")
    public multiMarkAndTickAndCheckRates(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        let meter = new Meter(this.clock, 1);

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

    @test("mark and multi tick and check rates withing same rate-interval")
    public markAndMultiTickAndCheckRatesWithinSameRateInterval(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        let meter = new Meter(this.clock, 1);

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

    @test("mark and multi tick and check rates within different rate-intervals")
    public markAndMultiTickAndCheckRatesWithinDifferentRateIntervals(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        let meter = new Meter(this.clock, 1);

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
