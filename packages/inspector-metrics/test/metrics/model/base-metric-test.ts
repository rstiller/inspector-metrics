/* eslint-env mocha */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "@testdeck/mocha";

import { Metadata, Tags } from "../../../lib/metrics";
import {
    BaseMetric,
    getMetricDescription,
    getMetricGroup,
    getMetricMetadata,
    getMetricName,
    getMetricTags,
    isSerializableMetric,
    Metric,
} from "../../../lib/metrics/model/metric";

const expect = chai.expect;

export class TestMetric extends BaseMetric {}

export class UnserializableMetric implements Metric {
    private tags: Map<string, string> = new Map();
    private group: string;
    private name: string;
    private description: string;
    private metadata: Map<string, any> = new Map();
    public getMetadataMap(): Map<string, any> {
        return this.metadata;
    }
    public getMetadata<T>(name: string): T {
        return this.metadata.get(name) as T;
    }
    public removeMetadata<T>(name: string): T {
        const value = this.metadata.get(name) as T;
        this.metadata.delete(name);
        return value;
    }
    public setMetadata<T>(name: string, value: T): this {
        this.metadata.set(name, value);
        return this;
    }
    public getName(): string {
        return this.name;
    }
    public setName(name: string): this {
        this.name = name;
        return this;
    }
    public getDescription(): string {
        return this.description;
    }
    public setDescription(description: string): this {
        this.description = description;
        return this;
    }
    public getGroup(): string {
        return this.group;
    }
    public setGroup(group: string): this {
        this.group = group;
        return this;
    }
    public getTags(): Map<string, string> {
        return this.tags;
    }
    public getTag(name: string): string {
        return this.tags.get(name);
    }
    public setTag(name: string, value: string): this {
        this.tags.set(name, value);
        return this;
    }
    public setTags(tags: Map<string, string>): this {
        this.tags = tags;
        return this;
    }
    public addTags(tags: Map<string, string>): this {
        tags.forEach((value, key) => this.tags.set(key, value));
        return this;
    }
    public removeTag(name: string): this {
        this.tags.delete(name);
        return this;
    }
    public removeTags(...names: string[]): this {
        names.forEach((name) => this.removeTag(name));
        return this;
    }
}

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

    @test
    public "check isSerializableMetric"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric().setName("Test")));
        expect(isSerializableMetric(serializedMetric)).to.equal(true);
        expect(isSerializableMetric(new TestMetric())).to.equal(false);
        expect(isSerializableMetric(new UnserializableMetric())).to.equal(false);
    }

    @test
    public "check getMetricName"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric().setName("Test1")));
        expect(getMetricName(serializedMetric)).to.equal("Test1");
        expect(getMetricName(new TestMetric().setName("Test2"))).to.equal("Test2");
    }

    @test
    public "check getMetricDescription"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric()
            .setName("Test1")
            .setDescription("description 1")));
        expect(getMetricDescription(serializedMetric)).to.equal("description 1");
        expect(getMetricDescription(new TestMetric()
            .setName("Test2")
            .setDescription("description 2"))).to.equal("description 2");
    }

    @test
    public "check getMetricGroup"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric()
            .setName("Test1")
            .setGroup("group 1")));
        expect(getMetricGroup(serializedMetric)).to.equal("group 1");
        expect(getMetricGroup(new TestMetric()
            .setName("Test2")
            .setGroup("group 2"))).to.equal("group 2");
    }

    @test
    public "check getMetricTags"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric()
            .setName("Test1")
            .setTag("key1", "value1")
            .setTag("key2", "value2")));
        let tags: Tags = getMetricTags(serializedMetric);
        expect(tags.key1).to.equal("value1");
        expect(tags.key2).to.equal("value2");
        expect(Object.keys(tags).length).to.equal(2);

        const metric = new TestMetric()
            .setName("Test1")
            .setTag("key1", "value1")
            .setTag("key2", "value2");
        tags = getMetricTags(metric);
        expect(tags.key1).to.equal("value1");
        expect(tags.key2).to.equal("value2");
        expect(Object.keys(tags).length).to.equal(2);
    }

    @test
    public "check getMetricMetadata"(): void {
        const serializedMetric = JSON.parse(JSON.stringify(new TestMetric()
            .setName("Test1")
            .setMetadata("key1", 1)
            .setMetadata("key2", "value2")));
        let metadata: Metadata = getMetricMetadata(serializedMetric);
        expect(metadata.key1).to.equal(1);
        expect(metadata.key2).to.equal("value2");
        expect(Object.keys(metadata).length).to.equal(2);

        const metric = new TestMetric()
            .setName("Test1")
            .setMetadata("key1", 3)
            .setMetadata("key2", "value4");
        metadata = getMetricMetadata(metric);
        expect(metadata.key1).to.equal(3);
        expect(metadata.key2).to.equal("value4");
        expect(Object.keys(metadata).length).to.equal(2);
    }

}
