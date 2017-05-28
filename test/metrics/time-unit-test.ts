import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import * as TimeUnit from "../../lib/metrics/time-unit";

const expect = chai.expect;

@suite
export class TimeUnitTest {

    @test
    public "check time-unit conversion"(): void {
        expect(TimeUnit.NANOSECOND.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1);
        expect(TimeUnit.MICROSECOND.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e3);
        expect(TimeUnit.MILLISECOND.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e6);
        expect(TimeUnit.SECOND.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e9);
        expect(TimeUnit.MINUTE.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e9 * 60);
        expect(TimeUnit.HOUR.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e9 * 60 * 60);
        expect(TimeUnit.DAY.convertTo(1, TimeUnit.NANOSECOND)).to.equal(1e9 * 60 * 60 * 24);

        expect(TimeUnit.NANOSECOND.convertTo(1e3, TimeUnit.MICROSECOND)).to.equal(1);
        expect(TimeUnit.NANOSECOND.convertTo(1e6, TimeUnit.MILLISECOND)).to.equal(1);
        expect(TimeUnit.NANOSECOND.convertTo(1e9, TimeUnit.SECOND)).to.equal(1);
        expect(TimeUnit.NANOSECOND.convertTo(1e9 * 60, TimeUnit.MINUTE)).to.equal(1);
        expect(TimeUnit.NANOSECOND.convertTo(1e9 * 60 * 60, TimeUnit.HOUR)).to.equal(1);
        expect(TimeUnit.NANOSECOND.convertTo(1e9 * 60 * 60 * 24, TimeUnit.DAY)).to.equal(1);

        expect(TimeUnit.NANOSECOND.convertTo(1, TimeUnit.MICROSECOND)).to.equal(1e-3);
        expect(TimeUnit.NANOSECOND.convertTo(1, TimeUnit.MILLISECOND)).to.equal(1e-6);
        expect(TimeUnit.NANOSECOND.convertTo(1, TimeUnit.SECOND)).to.equal(1e-9);

        expect(TimeUnit.NANOSECOND.getNanosecondsPerUnit()).to.equal(1);
        expect(TimeUnit.MICROSECOND.getNanosecondsPerUnit()).to.equal(1e3);
        expect(TimeUnit.MILLISECOND.getNanosecondsPerUnit()).to.equal(1e6);
        expect(TimeUnit.SECOND.getNanosecondsPerUnit()).to.equal(1e9);
        expect(TimeUnit.MINUTE.getNanosecondsPerUnit()).to.equal(1e9 * 60);
        expect(TimeUnit.HOUR.getNanosecondsPerUnit()).to.equal(1e9 * 3600);
        expect(TimeUnit.DAY.getNanosecondsPerUnit()).to.equal(1e9 * 3600 * 24);
    }

}
