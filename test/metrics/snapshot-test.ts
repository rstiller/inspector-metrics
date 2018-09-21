import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { SimpleSnapshot } from "../../lib/metrics/snapshot";

const expect = chai.expect;

@suite
export class SnapshotTest {

    @test
    public "check sort of values"(): void {
        const snapshot = new SimpleSnapshot([1, 2, 3, 5, 100, 300, -1, -999, -100, 200, 0, 400, 999, 4, 846]);

        expect(`${snapshot.getValues()}`)
            .to.deep.equal(`${[-999, -100, -1, 0, 1, 2, 3, 4, 5, 100, 200, 300, 400, 846, 999]}`);
        expect(snapshot.getMax()).to.equal(999);
        expect(snapshot.getMin()).to.equal(-999);
    }

}
