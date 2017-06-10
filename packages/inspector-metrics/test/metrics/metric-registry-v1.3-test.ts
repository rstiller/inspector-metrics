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

        registry.registerMetric(gauge1);
        registry.registerMetric(gauge2);

        expect(registry.getMetricsByName("myValue")).to.have.length(2);

        const metrics = registry.getMetricList();
        expect(metrics).to.have.length(2);
        expect(metrics[0]).to.equal(gauge1);
        expect(metrics[1]).to.equal(gauge2);

        registry.removeMetrics("myValue");

        expect(registry.getMetricList()).to.have.length(0);
    }

    @test
    public "register metrics-set within metrics-registry"(): void {
        const registry1: MetricRegistry = new MetricRegistry();
        const registry2: MetricRegistry = new MetricRegistry();

        expect(registry1.getMetricList()).to.have.length(0);
        expect(registry2.getMetricList()).to.have.length(0);

        const gauge1 = new SimpleGauge("myValue");
        gauge1.setTag("type", "type1");
        const gauge2 = new SimpleGauge("myValue");
        gauge2.setTag("type", "type2");
        const gauge3 = new SimpleGauge("myValue");
        gauge3.setTag("type", "type3");
        const gauge4 = new SimpleGauge("myValue");
        gauge4.setTag("type", "type4");

        registry1.registerMetric(gauge1);
        registry1.registerMetric(gauge2);

        registry2.registerMetric(gauge3);
        registry2.registerMetric(gauge4);

        registry1.registerMetric(registry2);

        expect(registry1.getMetricsByName("myValue")).to.have.length(4);
        expect(registry2.getMetricsByName("myValue")).to.have.length(2);

        let metrics = registry2.getMetricList();
        expect(metrics).to.have.length(2);
        expect(metrics[0]).to.equal(gauge3);
        expect(metrics[1]).to.equal(gauge4);

        registry2.removeMetrics("myValue");

        expect(registry1.getMetricList()).to.have.length(4);
        expect(registry2.getMetricList()).to.have.length(0);

        metrics = registry1.getMetricList();
        expect(metrics).to.have.length(4);
        expect(metrics[0]).to.equal(gauge1);
        expect(metrics[1]).to.equal(gauge2);
        expect(metrics[2]).to.equal(gauge3);
        expect(metrics[3]).to.equal(gauge4);

        registry1.removeMetrics("myValue");

        expect(registry1.getMetricList()).to.have.length(0);
        expect(registry2.getMetricList()).to.have.length(0);
    }

}
