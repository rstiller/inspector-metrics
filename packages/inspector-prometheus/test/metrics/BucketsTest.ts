/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import { Buckets } from "../../lib/metrics";

const expect = chai.expect;

@suite
export class BucketsTest {

    @test
    public "checking linear bucket creation"(): void {
        expect(Buckets.linear(0, 0.1, 5).boundaries)
            .to.deep.equal([0.0, 0.1, 0.2, 0.3, 0.4]);

        expect(Buckets.linear(0, 0.5, 5).boundaries)
            .to.deep.equal([0.0, 0.5, 1.0, 1.5, 2.0]);

        expect(Buckets.linear(-5, 0.5, 20).boundaries)
            .to.deep.equal([
                -5.0, -4.5, -4.0, -3.5, -3.0,
                -2.5, -2.0, -1.5, -1.0, -0.5,
                0.0, 0.5, 1.0, 1.5, 2.0,
                2.5, 3.0, 3.5, 4.0, 4.5,
            ]);
    }

    @test
    public "checking precision of linear bucket"(): void {
        expect(Buckets.linear(0, 0.0001, 5).boundaries)
            .to.deep.equal([0.0, 0.0001, 0.0002, 0.0003, 0.0004]);

        expect(Buckets.linear(0, 0.00001, 11).boundaries)
            .to.deep.equal([
                0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0,
                0.0001,
            ]);

        expect(Buckets.linear(0, 0.000001, 5, 1000000).boundaries)
            .to.deep.equal([0.0, 0.000001, 0.000002, 0.000003, 0.000004]);

        expect(Buckets.linear(0, 0.0000001, 11, 1000000).boundaries)
            .to.deep.equal([
                0.0, 0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0, 0.0,
                0.000001,
            ]);
    }

    @test
    public "checking exponential bucket creation"(): void {
        expect(Buckets.exponential(0.1, 2, 5).boundaries)
            .to.deep.equal([0.1, 0.2, 0.4, 0.8, 1.6]);

        expect(Buckets.exponential(1.0, 5, 5).boundaries)
            .to.deep.equal([1.0, 5.0, 25.0, 125.0, 625.0]);
    }

    @test
    public "checking precision of exponential bucket"(): void {
        expect(Buckets.exponential(1, 1.0001, 5).boundaries)
            .to.deep.equal([1.0, 1.0001, 1.0002, 1.0003, 1.0004]);

        expect(Buckets.exponential(1, 1.00001, 5, 100000).boundaries)
            .to.deep.equal([1.0, 1.00001, 1.00002, 1.00003, 1.00004]);

        expect(Buckets.exponential(1, 1.0000002, 10, 100000000).boundaries)
            .to.deep.equal([
                1.00000000, 1.00000019, 1.00000039, 1.00000059, 1.00000079,
                1.00000099, 1.00000119, 1.00000139, 1.00000159, 1.00000179,
            ]);
    }

}
