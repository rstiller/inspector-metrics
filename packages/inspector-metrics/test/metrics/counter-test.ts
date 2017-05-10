
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Counter } from "../../lib/metrics/counter";

const expect = chai.expect;

@suite
export class CounterTest {

    @test
    public "check count, reset and get"(): void {
        const counter: Counter = new Counter();
        expect(counter.getCount()).to.equal(0);
        counter.increment(1);
        expect(counter.getCount()).to.equal(1);
        counter.reset();
        expect(counter.getCount()).to.equal(0);
        counter.decrement(1);
        expect(counter.getCount()).to.equal(-1);
        counter.reset();
        expect(counter.getCount()).to.equal(0);
        counter.increment(-1);
        expect(counter.getCount()).to.equal(-1);
        counter.reset();
        expect(counter.getCount()).to.equal(0);
        counter.decrement(-1);
        expect(counter.getCount()).to.equal(1);
    }

}
