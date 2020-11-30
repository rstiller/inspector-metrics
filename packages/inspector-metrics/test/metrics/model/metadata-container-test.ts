/* eslint-env mocha */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";

import { suite, test } from "@testdeck/mocha";
import { mapToMetadata, Metadata, metadataToMap } from "../../../lib/metrics";

const expect = chai.expect;

@suite
export class MetadataContainerTest {

    @test
    public "check metadataToMap"(): void {
        let map: Map<string, any>;

        map = metadataToMap(null);
        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(0);

        map = metadataToMap({});
        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(0);

        map = metadataToMap({
            metadata1: "value1",
        });

        expect(map).to.be.instanceOf(Map);
        expect(map.size).to.equal(1);
        expect(map.get("metadata1")).to.equal("value1");
    }

    @test
    public "check mapToMetadata"(): void {
        const map: Map<string, any> = new Map();
        map.set("metadata1", "value1");

        let metadata: Metadata;

        metadata = mapToMetadata(null);
        expect(Object.keys(metadata).length).to.equal(0);

        metadata = mapToMetadata(new Map());
        expect(Object.keys(metadata).length).to.equal(0);

        metadata = mapToMetadata(map);
        expect(Object.keys(metadata).length).to.equal(1);
        expect(metadata.metadata1).to.equal("value1");
    }

}
