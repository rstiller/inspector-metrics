/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { SlidingWindowReservoir } from "../../lib/metrics/reservoir";
import { Snapshot } from "../../lib/metrics/snapshot";
import { MICROSECOND, NANOSECOND } from "../../lib/metrics/time-unit";
import { StopWatch, Timer } from "../../lib/metrics/timer";
import { MockedClock } from "./mocked-clock";

const expect = chai.expect;

@suite("Timer")
export class TimerTest {

    private clock: MockedClock = new MockedClock();

    @test("negative duration")
    public checkNegativeDuration(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        timer.addDuration(-1, NANOSECOND);

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);
    }

    @test("single duration measuring with no tick")
    public checkSingleDurationMeasuringWithNoTick(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        timer.addDuration(10, MICROSECOND);

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(Infinity);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000);
        expect(snapshot.get95thPercentile()).to.equal(10000);
        expect(snapshot.get98thPercentile()).to.equal(10000);
        expect(snapshot.get99thPercentile()).to.equal(10000);
        expect(snapshot.get999thPercentile()).to.equal(10000);
        expect(snapshot.getMax()).to.equal(10000);
        expect(snapshot.getMean()).to.equal(10000);
        expect(snapshot.getMedian()).to.equal(10000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.be.NaN;
    }

    @test("multiple duration measuring with no tick")
    public checkMultipleDurationMeasuringWithNoTick(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(3);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(Infinity);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);
    }

    @test("single duration measuring with one tick")
    public checkSingleDurationMeasuringWithOneTick(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.lessThan(1);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000);
        expect(snapshot.get95thPercentile()).to.equal(10000);
        expect(snapshot.get98thPercentile()).to.equal(10000);
        expect(snapshot.get99thPercentile()).to.equal(10000);
        expect(snapshot.get999thPercentile()).to.equal(10000);
        expect(snapshot.getMax()).to.equal(10000);
        expect(snapshot.getMean()).to.equal(10000);
        expect(snapshot.getMedian()).to.equal(10000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.be.NaN;
    }

    @test("multiple duration measuring with one tick")
    public checkMultipleDurationMeasuringWithOneTick(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(3);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.lessThan(3);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);
    }

    @test("multiple duration measuring with multiple ticks")
    public checkMultipleDurationMeasuringWithMultipleTicks(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(3);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.lessThan(3);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);

        this.clock.setCurrentTime({
            milliseconds: 2001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(6);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.lessThan(3);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);
    }

    @test("multiple duration measuring with multiple ticks within different rate-intervals")
    public checkMultipleDurationMeasuringWithMultipleTicksWithinDifferentRateIntervals(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(3);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.lessThan(3);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);

        this.clock.setCurrentTime({
            milliseconds: 5001,
            nanoseconds: 0,
        });
        timer.addDuration(10, MICROSECOND);
        timer.addDuration(20, MICROSECOND);
        timer.addDuration(30, MICROSECOND);

        expect(timer.getCount()).to.equal(6);
        expect(timer.get15MinuteRate()).to.greaterThan(0);
        expect(timer.get5MinuteRate()).to.greaterThan(0);
        expect(timer.get1MinuteRate()).to.greaterThan(0);
        expect(timer.getMeanRate()).to.lessThan(3);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(30000);
        expect(snapshot.get95thPercentile()).to.equal(30000);
        expect(snapshot.get98thPercentile()).to.equal(30000);
        expect(snapshot.get99thPercentile()).to.equal(30000);
        expect(snapshot.get999thPercentile()).to.equal(30000);
        expect(snapshot.getMax()).to.equal(30000);
        expect(snapshot.getMean()).to.equal(20000);
        expect(snapshot.getMedian()).to.equal(20000);
        expect(snapshot.getMin()).to.equal(10000);
        expect(snapshot.getStdDev()).to.equal(10000);
    }

    @test("add duration with time function")
    public checkTimeFunction(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        timer.time(() => {
            this.clock.setCurrentTime({
                milliseconds: 10,
                nanoseconds: 0,
            });
        });
        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.greaterThan(0);
        expect(timer.get5MinuteRate()).to.greaterThan(0);
        expect(timer.get1MinuteRate()).to.greaterThan(0);
        expect(timer.getMeanRate()).to.lessThan(1);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000000);
        expect(snapshot.get95thPercentile()).to.equal(10000000);
        expect(snapshot.get98thPercentile()).to.equal(10000000);
        expect(snapshot.get99thPercentile()).to.equal(10000000);
        expect(snapshot.get999thPercentile()).to.equal(10000000);
        expect(snapshot.getMax()).to.equal(10000000);
        expect(snapshot.getMean()).to.equal(10000000);
        expect(snapshot.getMedian()).to.equal(10000000);
        expect(snapshot.getMin()).to.equal(10000000);
        expect(snapshot.getStdDev()).to.be.NaN;
    }

}

@suite("StopWatch")
export class StopWatchTest {

    private clock: MockedClock = new MockedClock();

    @test("start and stop without time difference")
    public checkStartAndStopWithoutTimeDifference(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));
        const stopWatch: StopWatch = timer.newStopWatch();

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        stopWatch.start();
        stopWatch.stop();

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(Infinity);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.equal(0);
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.equal(0);
        expect(snapshot.getStdDev()).to.be.NaN;
    }

    @test("start and stop with time difference")
    public checkStartAndStopWithTimeDifference(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));
        const stopWatch: StopWatch = timer.newStopWatch();

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        stopWatch.start();

        this.clock.setCurrentTime({
            milliseconds: 10,
            nanoseconds: 0,
        });

        stopWatch.stop();

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.greaterThan(0);
        expect(timer.get5MinuteRate()).to.greaterThan(0);
        expect(timer.get1MinuteRate()).to.greaterThan(0);
        expect(timer.getMeanRate()).to.lessThan(1);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000000);
        expect(snapshot.get95thPercentile()).to.equal(10000000);
        expect(snapshot.get98thPercentile()).to.equal(10000000);
        expect(snapshot.get99thPercentile()).to.equal(10000000);
        expect(snapshot.get999thPercentile()).to.equal(10000000);
        expect(snapshot.getMax()).to.equal(10000000);
        expect(snapshot.getMean()).to.equal(10000000);
        expect(snapshot.getMedian()).to.equal(10000000);
        expect(snapshot.getMin()).to.equal(10000000);
        expect(snapshot.getStdDev()).to.be.NaN;
    }

    @test("start and stop with time difference within different rate-intervals")
    public checkStartAndStopWithTimeDifferenceWithinDifferentRateIntervals(): void {
        this.clock.setCurrentTime({
            milliseconds: 0,
            nanoseconds: 0,
        });
        const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3));
        const stopWatch: StopWatch = timer.newStopWatch();

        expect(timer.getCount()).to.equal(0);
        expect(timer.get15MinuteRate()).to.equal(0);
        expect(timer.get5MinuteRate()).to.equal(0);
        expect(timer.get1MinuteRate()).to.equal(0);
        expect(timer.getMeanRate()).to.equal(0);

        let snapshot: Snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);

        stopWatch.start();

        this.clock.setCurrentTime({
            milliseconds: 10,
            nanoseconds: 0,
        });

        stopWatch.stop();

        this.clock.setCurrentTime({
            milliseconds: 1001,
            nanoseconds: 0,
        });

        expect(timer.getCount()).to.equal(1);
        expect(timer.get15MinuteRate()).to.greaterThan(0);
        expect(timer.get5MinuteRate()).to.greaterThan(0);
        expect(timer.get1MinuteRate()).to.greaterThan(0);
        expect(timer.getMeanRate()).to.lessThan(1);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000000);
        expect(snapshot.get95thPercentile()).to.equal(10000000);
        expect(snapshot.get98thPercentile()).to.equal(10000000);
        expect(snapshot.get99thPercentile()).to.equal(10000000);
        expect(snapshot.get999thPercentile()).to.equal(10000000);
        expect(snapshot.getMax()).to.equal(10000000);
        expect(snapshot.getMean()).to.equal(10000000);
        expect(snapshot.getMedian()).to.equal(10000000);
        expect(snapshot.getMin()).to.equal(10000000);
        expect(snapshot.getStdDev()).to.be.NaN;

        stopWatch.start();

        this.clock.setCurrentTime({
            milliseconds: 1011,
            nanoseconds: 0,
        });

        stopWatch.stop();

        this.clock.setCurrentTime({
            milliseconds: 5001,
            nanoseconds: 0,
        });

        expect(timer.getCount()).to.equal(2);
        expect(timer.get15MinuteRate()).to.greaterThan(0);
        expect(timer.get5MinuteRate()).to.greaterThan(0);
        expect(timer.get1MinuteRate()).to.greaterThan(0);
        expect(timer.getMeanRate()).to.lessThan(1);

        snapshot = timer.getSnapshot();
        expect(snapshot.get75thPercentile()).to.equal(10000000);
        expect(snapshot.get95thPercentile()).to.equal(10000000);
        expect(snapshot.get98thPercentile()).to.equal(10000000);
        expect(snapshot.get99thPercentile()).to.equal(10000000);
        expect(snapshot.get999thPercentile()).to.equal(10000000);
        expect(snapshot.getMax()).to.equal(10000000);
        expect(snapshot.getMean()).to.equal(10000000);
        expect(snapshot.getMedian()).to.equal(10000000);
        expect(snapshot.getMin()).to.equal(10000000);
        expect(snapshot.getStdDev()).to.equal(0);
    }

}
