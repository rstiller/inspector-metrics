
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { ExponentiallyWeightedMovingAverage } from "../../lib/metrics/moving-average";
import { MILLISECOND } from "../../lib/metrics/time-unit";

const expect = chai.expect;

@suite("ExponentiallyWeightedMovingAverage")
export class ExponentiallyWeightedMovingAverageTest {

    private movingAverage: ExponentiallyWeightedMovingAverage;

    public before(): void {
        this.movingAverage = new ExponentiallyWeightedMovingAverage(0.5, 1, MILLISECOND);
    }

    @test("check basics")
    public checkBasics(): void {
        expect(this.movingAverage.getAlpha()).to.equal(0.5);
        expect(this.movingAverage.getUnit()).to.equal(MILLISECOND);
    }

    @test("no values")
    public checkWithNoValues(): void {
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(0);
    }

    @test("1 value average")
    public checkWithOnly1Value(): void {
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(0);
        this.movingAverage.update(5);
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(0);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5.0);
    }

    @test("multiple values")
    public checkWithMultipleValues(): void {
        this.movingAverage.update(5);
        this.movingAverage.tick();
        this.movingAverage.update(6);
        this.movingAverage.tick();
        this.movingAverage.update(7);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(6.25);
    }

    @test("multiple values - degraded")
    public checkWithMultipleValuesDegraded(): void {
        this.movingAverage.update(5);
        this.movingAverage.tick();
        this.movingAverage.update(6);
        this.movingAverage.tick();
        this.movingAverage.update(7);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(6.25);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(3.125);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(1.5625);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(0.78125);
    }

    @test("multiple values - all same")
    public checkWithMultipleValuesAllSame(): void {
        this.movingAverage.update(5);
        this.movingAverage.tick();
        this.movingAverage.update(5);
        this.movingAverage.tick();
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
    }

    @test("multiple values - increasing")
    public checkWithMultipleValuesIncreasing(): void {
        this.movingAverage.update(5);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(5);
        this.movingAverage.update(7);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(6);
        this.movingAverage.update(8);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(7);
        this.movingAverage.update(9);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(8);
        this.movingAverage.update(9);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(8.5);
        this.movingAverage.update(9);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(8.75);
        this.movingAverage.update(9);
        this.movingAverage.tick();
        expect(this.movingAverage.getAverage(MILLISECOND)).to.equal(8.875);
    }

}
