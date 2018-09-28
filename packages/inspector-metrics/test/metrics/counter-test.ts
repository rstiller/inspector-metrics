// tslint:disable:no-unused-expression
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Counter, MonotoneCounter } from "../../lib/metrics/counter";

const assert = chai.assert;
const expect = chai.expect;

@suite
export class CounterTest {

    @test
    public "check name and description"(): void {
        let counter: Counter = new Counter();
        expect(counter.getName()).to.be.undefined;
        expect(counter.getDescription()).to.be.undefined;

        counter = new Counter("counter-name");
        expect(counter.getName()).to.equal("counter-name");
        expect(counter.getDescription()).to.be.undefined;

        counter = new Counter("counter-name", "counter-description");
        expect(counter.getName()).to.equal("counter-name");
        expect(counter.getDescription()).to.equal("counter-description");
    }

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

@suite
export class MonotoneCounterTest {

    @test
    public "check name and description"(): void {
        let counter: MonotoneCounter = new MonotoneCounter();
        expect(counter.getName()).to.be.undefined;
        expect(counter.getDescription()).to.be.undefined;

        counter = new MonotoneCounter("counter-name");
        expect(counter.getName()).to.equal("counter-name");
        expect(counter.getDescription()).to.be.undefined;

        counter = new MonotoneCounter("counter-name", "counter-description");
        expect(counter.getName()).to.equal("counter-name");
        expect(counter.getDescription()).to.equal("counter-description");
    }

    @test
    public "check count, reset and get"(): void {
        const counter: MonotoneCounter = new MonotoneCounter();
        expect(counter.getCount()).to.equal(0);
        counter.increment(1);
        expect(counter.getCount()).to.equal(1);
        counter.reset();
        expect(counter.getCount()).to.equal(0);
    }

    @test
    public "check increase by negative value"(): void {
        const counter: MonotoneCounter = new MonotoneCounter();
        expect(counter.getCount()).to.equal(0);
        try {
            counter.increment(-1);
            assert.fail("An exception should be thrown");
        } catch (e) {
            expect(e).to.be.instanceOf(Error);
        }
    }

}
