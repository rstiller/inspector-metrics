/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { diff, StdClock, Time } from "../../lib/metrics/clock";

const expect = chai.expect;

@suite
export class DiffTest {

    @test
    public "diff with null values"(): void {
        expect(diff(null, null)).to.equal(0);
    }

    @test
    public "diff with same value"(): void {
        const time: Time = {
            milliseconds: 0,
            nanoseconds: 0,
        };
        expect(diff(time, time)).to.equal(0);
    }

    @test
    public "diff with different nanoseconds"(): void {
        const one: Time = {
            milliseconds: 0,
            nanoseconds: 0,
        };
        const two: Time = {
            milliseconds: 0,
            nanoseconds: 1,
        };
        expect(diff(one, two)).to.equal(1);
    }

    @test
    public "diff with different milliseconds"(): void {
        const one: Time = {
            milliseconds: 0,
            nanoseconds: 0,
        };
        const two: Time = {
            milliseconds: 1,
            nanoseconds: 0,
        };
        expect(diff(one, two)).to.equal(1000000);
    }

    @test
    public "diff with different milliseconds and nanoseconds"(): void {
        const one: Time = {
            milliseconds: 0,
            nanoseconds: 0,
        };
        const two: Time = {
            milliseconds: 1,
            nanoseconds: 2,
        };
        expect(diff(one, two)).to.equal(1000002);
    }

}

@suite
export class StdClockTest {

    @test
    public "check time function"(): void {
        const time = new StdClock().time();
        expect(time).to.be.not.null;
    }

}
