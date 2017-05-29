/* tslint:disable:no-unused-expression */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";
import * as sinonChai from "sinon-chai";

import { SimpleGauge } from "../../lib/metrics/gauge";
import { MetricRegistry } from "../../lib/metrics/metric-registry";

chai.use(sinonChai);

const expect = chai.expect;

@suite
export class MetricRegistryTest {

    @test
    public "register multiple metrics with same name"(): void {
        const registry: MetricRegistry = new MetricRegistry();

        expect(registry.getMetricList()).to.have.length(0);

        const gauge1 = new SimpleGauge("myValue");
        gauge1.setTag("type", "type1");
        const gauge2 = new SimpleGauge("myValue");
        gauge2.setTag("type", "type2");

        registry.register("myValue", gauge1);
        registry.register("myValue", gauge2);

        expect(registry.getMetricsByName("myValue")).to.have.length(2);

        const metrics = registry.getMetricList();
        expect(metrics).to.have.length(2);
        expect(metrics[0]).to.equal(gauge1);
        expect(metrics[1]).to.equal(gauge2);

        registry.removeMetrics("myValue");

        expect(registry.getMetricList()).to.have.length(0);
    }

}
