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

@suite
export class TimerTest {

    private clock: MockedClock = new MockedClock();

    @test
    public "negative duration"(): void {
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

    @test
    public "single duration measuring with no tick"(): void {
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

    @test
    public "multiple duration measuring with no tick"(): void {
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

    @test
    public "single duration measuring with one tick"(): void {
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

    @test
    public "multiple duration measuring with one tick"(): void {
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

    @test
    public "multiple duration measuring with multiple ticks"(): void {
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

    @test
    public "multiple duration measuring with multiple ticks within different rate-intervals"(): void {
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

    @test
    public "add duration with time function"(): void {
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

    @test
    public "add duration with async time function"(callback: () => any): void {
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

        timer.timeAsync(() => {
            return new Promise((resolve) => {
                this.clock.setCurrentTime({
                    milliseconds: 10,
                    nanoseconds: 0,
                });
                resolve();
            });
        })
        .then(() => {
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
        })
        .then(callback);
    }

}

@suite
export class StopWatchTest {

    private clock: MockedClock = new MockedClock();

    @test
    public "start and stop without time difference"(): void {
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

    @test
    public "start and stop with time difference"(): void {
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

    @test
    public "start and stop with time difference within different rate-intervals"(): void {
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
