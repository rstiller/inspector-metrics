// tslint:disable:no-unused-expression
import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import { suite, test } from "mocha-typescript";

import { SimpleGauge } from "../../lib/metrics/gauge";

const expect = chai.expect;

@suite
export class SimpleGaugeTest {

    @test
    public "check name and description"(): void {
        let gauge: SimpleGauge = new SimpleGauge();
        expect(gauge.getName()).to.be.undefined;
        expect(gauge.getDescription()).to.be.undefined;

        gauge = new SimpleGauge("gauge-name");
        expect(gauge.getName()).to.equal("gauge-name");
        expect(gauge.getDescription()).to.be.undefined;

        gauge = new SimpleGauge("gauge-name", "gauge-description");
        expect(gauge.getName()).to.equal("gauge-name");
        expect(gauge.getDescription()).to.equal("gauge-description");
    }

    @test
    public "check set and get value"(): void {
        const gauge: SimpleGauge = new SimpleGauge();
        expect(gauge.getValue()).to.equal(0);
        gauge.setValue(1);
        expect(gauge.getValue()).to.equal(1);
    }

    @test
    public "check serialization"(): void {
        const internalObject = {
            property1: "value1",
            property2: 2,
        };
        const gauge: SimpleGauge = new SimpleGauge("gauge-name", "gauge-description")
            .setTag("key1", "value1")
            .setTag("key2", "value2")
            .setMetadata("internalObject", internalObject);
        expect(gauge.getValue()).to.equal(0);
        gauge.setValue(1);
        expect(gauge.getValue()).to.equal(1);

        const serializedGauge = JSON.parse(JSON.stringify(gauge));
        expect(Object.keys(serializedGauge).length).to.equal(5);

        expect(serializedGauge).has.property("name");
        expect(serializedGauge.name).to.equal("gauge-name");

        expect(serializedGauge).has.property("description");
        expect(serializedGauge.description).to.equal("gauge-description");

        expect(serializedGauge).has.property("tags");
        expect(Object.keys(serializedGauge.tags).length).to.equal(2);
        expect(serializedGauge.tags.key1).to.equal("value1");
        expect(serializedGauge.tags.key2).to.equal("value2");

        expect(serializedGauge).has.property("metadata");
        expect(Object.keys(serializedGauge.metadata).length).to.equal(1);
        expect(serializedGauge.metadata.internalObject).to.deep.equal(internalObject);

        expect(serializedGauge).has.property("value");
        expect(serializedGauge.value).to.equal(1);
    }

}
