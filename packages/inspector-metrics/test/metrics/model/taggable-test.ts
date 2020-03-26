/* eslint-env mocha */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";

import { suite, test } from "mocha-typescript";
import { mapToTags, Tags, tagsToMap } from "../../../lib/metrics";

const expect = chai.expect;

@suite
export class TaggableTest {

    @test
    public "check tagsToMap"(): void {
        let map: Map<string, string>;

        map = tagsToMap(null);
        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(0);

        map = tagsToMap({});
        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(0);

        map = tagsToMap({
            key1: "value1",
        });

        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(1);
        expect(map.get("key1")).to.equal("value1");
    }

    @test
    public "check mapToTags"(): void {
        const map: Map<string, string> = new Map();
        map.set("key1", "value1");

        let tags: Tags;

        tags = mapToTags(null);
        expect(Object.keys(tags).length).to.equal(0);

        tags = mapToTags(new Map());
        expect(Object.keys(tags).length).to.equal(0);

        tags = mapToTags(map);
        expect(Object.keys(tags).length).to.equal(1);
        expect(tags.key1).to.equal("value1");
    }

}
