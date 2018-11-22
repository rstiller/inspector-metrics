// tslint:disable:no-unused-expression

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { BaseMetric } from "../../lib/metrics/metric";

const expect = chai.expect;

export class TestMetric extends BaseMetric {}

@suite
export class BaseMetricTest {

    @test
    public "add tag, set tag, remove tag, check tag"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getTags()).to.be.a("Map");
        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);

        baseMetric.setTag("application", "metric-app");

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getTag("application")).to.equal("metric-app");

        baseMetric.setTag("application", "metric-app2");

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getTag("application")).to.equal("metric-app2");

        baseMetric.removeTag("application");

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);
    }

    @test
    public "add metadata, set metadata, remove metadata, check metadata"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getMetadataMap()).to.be.a("Map");
        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, any>) => map.size === 0);

        baseMetric.setMetadata("config1", 123);
        baseMetric.setMetadata("config2", "Test");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, any>) => map.size === 2);
        expect(baseMetric.getMetadata("config1")).to.equal(123);
        expect(baseMetric.getMetadata("config2")).to.equal("Test");

        baseMetric.setMetadata("config1", 456);
        baseMetric.setMetadata("config2", "config test 2");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, string>) => map.size === 2);
        expect(baseMetric.getMetadata("config1")).to.equal(456);
        expect(baseMetric.getMetadata("config2")).to.equal("config test 2");

        baseMetric.removeMetadata("config2");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getMetadata("config1")).to.equal(456);
    }

    @test
    public "set group, check group"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getGroup()).to.be.undefined;

        baseMetric.setGroup("group1");

        expect(baseMetric.getGroup()).to.equal("group1");
    }

    @test
    public "set description, check description"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getDescription()).to.be.undefined;

        baseMetric.setDescription("description1");

        expect(baseMetric.getDescription()).to.equal("description1");
    }

    @test
    public "set multiple values with fluent interface"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getDescription()).to.be.undefined;
        expect(baseMetric.getGroup()).to.be.undefined;

        expect(baseMetric.getMetadataMap()).to.be.a("Map");
        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, any>) => map.size === 0);

        expect(baseMetric.getTags()).to.be.a("Map");
        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);

        baseMetric
            .setDescription("description1")
            .setGroup("group1")
            .setMetadata("config1", 123)
            .setMetadata("config2", "Test")
            .setTag("application", "metric-app");

        expect(baseMetric.getDescription()).to.equal("description1");
        expect(baseMetric.getGroup()).to.equal("group1");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, any>) => map.size === 2);
        expect(baseMetric.getMetadata("config1")).to.equal(123);
        expect(baseMetric.getMetadata("config2")).to.equal("Test");

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getTag("application")).to.equal("metric-app");

        baseMetric
            .setMetadata("config1", 456)
            .setMetadata("config2", "config test 2")
            .setTag("application", "metric-app2");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, string>) => map.size === 2);
        expect(baseMetric.getMetadata("config1")).to.equal(456);
        expect(baseMetric.getMetadata("config2")).to.equal("config test 2");

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getTag("application")).to.equal("metric-app2");

        baseMetric
            .removeTag("application")
            .removeMetadata("config2");

        expect(baseMetric.getMetadataMap()).to.satisfy((map: Map<string, string>) => map.size === 1);
        expect(baseMetric.getMetadata("config1")).to.equal(456);

        expect(baseMetric.getTags()).to.satisfy((map: Map<string, string>) => map.size === 0);
    }

}
