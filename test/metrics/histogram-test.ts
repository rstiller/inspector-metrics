/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Buckets } from "../../lib/metrics";
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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(2);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(3);
        expect(histogram.getSum().toNumber()).to.equal(3);
    }

    @test
    public "simple count and get with fluent interface"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(1024));
        expect(histogram.getCount()).to.equal(0);
        expect(histogram.getSum().toNumber()).to.equal(0);

        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);

        histogram
            .update(1)
            .update(2)
            .update(3)
            .update(4);

        expect(histogram.getCount()).to.equal(5);
        expect(histogram.getSum().toNumber()).to.equal(11);
    }

    @test
    public "update negative values"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(1024));
        expect(histogram.getCount()).to.equal(0);
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(10);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(10);
        histogram.update(-21);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(-11);
        histogram.update(33);
        expect(histogram.getCount()).to.equal(3);
        expect(histogram.getSum().toNumber()).to.equal(22);
    }

    @test
    public "check snapshot from no values"(): void {
        const histogram: Histogram = new Histogram(new DefaultReservoir(2));
        expect(histogram.getCount()).to.equal(0);
        expect(histogram.getSum().toNumber()).to.equal(0);

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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);

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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(2);

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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);
        histogram.update(3);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(4);

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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(2);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(3);
        expect(histogram.getSum().toNumber()).to.equal(3);

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
        expect(histogram.getSum().toNumber()).to.equal(0);
        histogram.update(1);
        expect(histogram.getCount()).to.equal(1);
        expect(histogram.getSum().toNumber()).to.equal(1);
        histogram.update(3);
        expect(histogram.getCount()).to.equal(2);
        expect(histogram.getSum().toNumber()).to.equal(4);

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
        expect(histogram.getSum().toNumber()).to.equal(9);

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

    @test
    public "check bucket counting"(): void {
        const buckets = Buckets.linear(10, 10, 10);
        const histogram: Histogram = new Histogram(new DefaultReservoir(1024), "name", "description", buckets);

        expect(histogram.getBuckets()).to.be.equal(buckets);
        expect(histogram.getBuckets().boundaries).to.deep.equal([
            10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
        ]);
        expect(histogram.getCounts()).to.satisfy((map: Map<number, number>) => map.size === 10);

        histogram.update(44);
        expect(histogram.getCount()).to.be.equal(1);
        expect(histogram.getCounts().get(10)).to.be.equal(0);
        expect(histogram.getCounts().get(20)).to.be.equal(0);
        expect(histogram.getCounts().get(30)).to.be.equal(0);
        expect(histogram.getCounts().get(40)).to.be.equal(0);
        expect(histogram.getCounts().get(50)).to.be.equal(1);
        expect(histogram.getCounts().get(60)).to.be.equal(1);
        expect(histogram.getCounts().get(70)).to.be.equal(1);
        expect(histogram.getCounts().get(80)).to.be.equal(1);
        expect(histogram.getCounts().get(90)).to.be.equal(1);
        expect(histogram.getCounts().get(100)).to.be.equal(1);

        histogram.update(1000);
        expect(histogram.getCount()).to.be.equal(2);
        expect(histogram.getCounts().get(10)).to.be.equal(0);
        expect(histogram.getCounts().get(20)).to.be.equal(0);
        expect(histogram.getCounts().get(30)).to.be.equal(0);
        expect(histogram.getCounts().get(40)).to.be.equal(0);
        expect(histogram.getCounts().get(50)).to.be.equal(1);
        expect(histogram.getCounts().get(60)).to.be.equal(1);
        expect(histogram.getCounts().get(70)).to.be.equal(1);
        expect(histogram.getCounts().get(80)).to.be.equal(1);
        expect(histogram.getCounts().get(90)).to.be.equal(1);
        expect(histogram.getCounts().get(100)).to.be.equal(1);

        histogram.update(10);
        expect(histogram.getCount()).to.be.equal(3);
        expect(histogram.getCounts().get(10)).to.be.equal(0);
        expect(histogram.getCounts().get(20)).to.be.equal(1);
        expect(histogram.getCounts().get(30)).to.be.equal(1);
        expect(histogram.getCounts().get(40)).to.be.equal(1);
        expect(histogram.getCounts().get(50)).to.be.equal(2);
        expect(histogram.getCounts().get(60)).to.be.equal(2);
        expect(histogram.getCounts().get(70)).to.be.equal(2);
        expect(histogram.getCounts().get(80)).to.be.equal(2);
        expect(histogram.getCounts().get(90)).to.be.equal(2);
        expect(histogram.getCounts().get(100)).to.be.equal(2);
    }

    @test
    public "check bucket counting more than reservoir capacity"(): void {
        const buckets = Buckets.linear(10, 10, 5);
        const histogram: Histogram = new Histogram(new DefaultReservoir(3), "name", "description", buckets);

        expect(histogram.getBuckets()).to.be.equal(buckets);
        expect(histogram.getBuckets().boundaries).to.deep.equal([
            10, 20, 30, 40, 50,
        ]);
        expect(histogram.getCounts()).to.satisfy((map: Map<number, number>) => map.size === 5);

        histogram.update(5);
        histogram.update(10);
        histogram.update(15);
        histogram.update(20);
        histogram.update(25);
        histogram.update(30);
        histogram.update(35);
        histogram.update(40);
        histogram.update(45);
        histogram.update(50);

        expect(histogram.getCount()).to.be.equal(10);
        expect(histogram.getCounts().get(10)).to.be.equal(1);
        expect(histogram.getCounts().get(20)).to.be.equal(3);
        expect(histogram.getCounts().get(30)).to.be.equal(5);
        expect(histogram.getCounts().get(40)).to.be.equal(7);
        expect(histogram.getCounts().get(50)).to.be.equal(9);
    }

}
