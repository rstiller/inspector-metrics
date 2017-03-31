
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { Taggable } from "../../lib/metrics/taggable";

const expect = chai.expect;

@suite("Taggable")
export class TaggableTest {

    @test("add tag, set tag, remove tag, check tag")
    public checkTags(): void {
        const taggable: Taggable = new Taggable();

        expect(taggable.getTags()).to.be.a("Map");
        expect(taggable.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);

        taggable.setTag("application", "metric-app");

        expect(taggable.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(taggable.getTag("application")).to.equal("metric-app");

        taggable.setTag("application", "metric-app2");

        expect(taggable.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(taggable.getTag("application")).to.equal("metric-app2");

        taggable.removeTag("application");

        expect(taggable.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);
    }

}
