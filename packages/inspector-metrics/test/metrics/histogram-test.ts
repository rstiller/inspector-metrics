/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Histogram } from "../../lib/metrics/histogram";
import { DefaultReservoir } from "../../lib/metrics/reservoir";

const expect = chai.expect;

@suite
export class HistogramTest {

    @test
    public "check name and description"(): void {
        let histogram: Histogram = new Histogram(new DefaultReservoir(1024));
        expect(histogram.getName()).to.be.undefined;
        expect(histogram.getDescription()).to.be.undefined;

        histogram = new Histogram(new DefaultReservoir(1024), "histogram-name");
        expect(histogram.getName()).to.equal("histogram-name");
        expect(histogram.getDescription()).to.be.undefined;

        histogram = new Histogram(new DefaultReservoir(1024), "histogram-name", "histogram-description");
        expect(histogram.getName()).to.equal("histogram-name");
        expect(histogram.getDescription()).to.equal("histogram-description");
    }

    @test
    public "simple count and get"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(1024));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(3);
    }

    @test
    public "check snapshot from no values"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);

        const snapshot = histogram.getSnapshot();
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

    @test
    public "check snapshot from one value"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);

        const snapshot = histogram.getSnapshot();
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

    @test
    public "check snapshot from same value twice"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);

        const snapshot = histogram.getSnapshot();
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

    @test
    public "check snapshot from different values"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        histogram.update(3);
        expect(histogram.getCount()).to.equal(2);

        const snapshot = histogram.getSnapshot();
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

    @test
    public "check snapshot from same value more times than capacity"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(3);

        const snapshot = histogram.getSnapshot();
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

    @test
    public "check snapshot from different values overloading capacity"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        histogram.update(3);
        expect(histogram.getCount()).to.equal(2);

        const snapshot1 = histogram.getSnapshot();
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

        histogram.update(5);
        expect(histogram.getCount()).to.equal(3);

        const snapshot2 = histogram.getSnapshot();
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
