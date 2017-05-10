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
    public "set group, check group"(): void {
        const baseMetric: BaseMetric = new TestMetric();

        expect(baseMetric.getGroup()).to.be.undefined;

        baseMetric.setGroup("group1");

        expect(baseMetric.getGroup()).to.equal("group1");
    }

}
