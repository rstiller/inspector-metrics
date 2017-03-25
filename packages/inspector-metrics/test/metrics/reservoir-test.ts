
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { DefaultReservoir, SlidingWindowReservoir } from "../../lib/metrics/reservoir";

const expect = chai.expect;

@suite("DefaultReservoir")
export class DefaultReservoirTest {

    @test("check correct size")
    public checkCorrectSize(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);
    }

    @test("check snapshot from no values")
    public checkSnapshotFromNoValues(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(0);
    }

    @test("check snapshot from one value")
    public checkSnapshotFromOneValue(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.be.NaN;
        expect(snapshot.size()).to.equal(1);
    }

    @test("check snapshot from same value twice")
    public checkSnapshotFromSameValueTwice(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from different values")
    public checkSnapshotFromDifferentValues(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(3);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(3);
        expect(snapshot.get95thPercentile()).to.equal(3);
        expect(snapshot.get98thPercentile()).to.equal(3);
        expect(snapshot.get999thPercentile()).to.equal(3);
        expect(snapshot.get99thPercentile()).to.equal(3);
        expect(snapshot.getMax()).to.equal(3);
        expect(snapshot.getMean()).to.equal(2);
        expect(snapshot.getMedian()).to.equal(3);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(Math.sqrt(2));
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from same value more times than capacity")
    public checkSnapshotFromSameValueMoreTimesThanCapacity(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from different values")
    public checkSnapshotsWithDifferentValues(): void {
        let reservoir = new DefaultReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(3);
        expect(reservoir.size()).to.equal(2);

        let snapshot1 = reservoir.snapshot();
        expect(snapshot1.get75thPercentile()).to.equal(3);
        expect(snapshot1.get95thPercentile()).to.equal(3);
        expect(snapshot1.get98thPercentile()).to.equal(3);
        expect(snapshot1.get999thPercentile()).to.equal(3);
        expect(snapshot1.get99thPercentile()).to.equal(3);
        expect(snapshot1.getMax()).to.equal(3);
        expect(snapshot1.getMean()).to.equal(2);
        expect(snapshot1.getMedian()).to.equal(3);
        expect(snapshot1.getMin()).to.equal(1);
        expect(snapshot1.getStdDev()).to.equal(Math.sqrt(2));
        expect(snapshot1.size()).to.equal(2);

        reservoir.update(5);
        expect(reservoir.size()).to.equal(2);

        let snapshot2 = reservoir.snapshot();
        expect(snapshot2.get75thPercentile()).to.equal(5);
        expect(snapshot2.get95thPercentile()).to.equal(5);
        expect(snapshot2.get98thPercentile()).to.equal(5);
        expect(snapshot2.get999thPercentile()).to.equal(5);
        expect(snapshot2.get99thPercentile()).to.equal(5);
        expect(snapshot2.getMax()).to.equal(5);
        expect(snapshot2.getMean()).to.be.gte(3);
        expect(snapshot2.getMedian()).to.be.gte(3);
        expect(snapshot2.getMin()).to.be.gte(1);
        expect(snapshot2.getStdDev()).to.be.gte(Math.sqrt(2));
        expect(snapshot2.size()).to.equal(2);
    }

}

@suite("SlidingWindowReservoir")
export class SlidingWindowReservoirTest {

    @test("check correct size")
    public checkCorrectSize(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);
    }

    @test("check snapshot from no values")
    public checkSnapshotFromNoValues(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(0);
        expect(snapshot.get95thPercentile()).to.equal(0);
        expect(snapshot.get98thPercentile()).to.equal(0);
        expect(snapshot.get999thPercentile()).to.equal(0);
        expect(snapshot.get99thPercentile()).to.equal(0);
        expect(snapshot.getMax()).to.be.undefined;
        expect(snapshot.getMean()).to.equal(0);
        expect(snapshot.getMedian()).to.equal(0);
        expect(snapshot.getMin()).to.be.undefined;
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(0);
    }

    @test("check snapshot from one value")
    public checkSnapshotFromOneValue(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.be.NaN;
        expect(snapshot.size()).to.equal(1);
    }

    @test("check snapshot from same value twice")
    public checkSnapshotFromSameValueTwice(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from different values")
    public checkSnapshotFromDifferentValues(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(3);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(3);
        expect(snapshot.get95thPercentile()).to.equal(3);
        expect(snapshot.get98thPercentile()).to.equal(3);
        expect(snapshot.get999thPercentile()).to.equal(3);
        expect(snapshot.get99thPercentile()).to.equal(3);
        expect(snapshot.getMax()).to.equal(3);
        expect(snapshot.getMean()).to.equal(2);
        expect(snapshot.getMedian()).to.equal(3);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(Math.sqrt(2));
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from same value more times than capacity")
    public checkSnapshotFromSameValueMoreTimesThanCapacity(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(2);

        let snapshot = reservoir.snapshot();
        expect(snapshot.get75thPercentile()).to.equal(1);
        expect(snapshot.get95thPercentile()).to.equal(1);
        expect(snapshot.get98thPercentile()).to.equal(1);
        expect(snapshot.get999thPercentile()).to.equal(1);
        expect(snapshot.get99thPercentile()).to.equal(1);
        expect(snapshot.getMax()).to.equal(1);
        expect(snapshot.getMean()).to.equal(1);
        expect(snapshot.getMedian()).to.equal(1);
        expect(snapshot.getMin()).to.equal(1);
        expect(snapshot.getStdDev()).to.equal(0);
        expect(snapshot.size()).to.equal(2);
    }

    @test("check snapshot from different values")
    public checkSnapshotsWithDifferentValues(): void {
        let reservoir = new SlidingWindowReservoir(2);
        expect(reservoir.size()).to.equal(0);
        reservoir.update(1);
        expect(reservoir.size()).to.equal(1);
        reservoir.update(3);
        expect(reservoir.size()).to.equal(2);

        let snapshot1 = reservoir.snapshot();
        expect(snapshot1.get75thPercentile()).to.equal(3);
        expect(snapshot1.get95thPercentile()).to.equal(3);
        expect(snapshot1.get98thPercentile()).to.equal(3);
        expect(snapshot1.get999thPercentile()).to.equal(3);
        expect(snapshot1.get99thPercentile()).to.equal(3);
        expect(snapshot1.getMax()).to.equal(3);
        expect(snapshot1.getMean()).to.equal(2);
        expect(snapshot1.getMedian()).to.equal(3);
        expect(snapshot1.getMin()).to.equal(1);
        expect(snapshot1.getStdDev()).to.equal(Math.sqrt(2));
        expect(snapshot1.size()).to.equal(2);

        reservoir.update(5);
        expect(reservoir.size()).to.equal(2);

        let snapshot2 = reservoir.snapshot();
        expect(snapshot2.get75thPercentile()).to.equal(5);
        expect(snapshot2.get95thPercentile()).to.equal(5);
        expect(snapshot2.get98thPercentile()).to.equal(5);
        expect(snapshot2.get999thPercentile()).to.equal(5);
        expect(snapshot2.get99thPercentile()).to.equal(5);
        expect(snapshot2.getMax()).to.equal(5);
        expect(snapshot2.getMean()).to.equal(4);
        expect(snapshot2.getMedian()).to.equal(5);
        expect(snapshot2.getMin()).to.equal(3);
        expect(snapshot2.getStdDev()).to.equal(Math.sqrt(2));
        expect(snapshot2.size()).to.equal(2);
    }

}
