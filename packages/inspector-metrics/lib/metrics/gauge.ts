
import "source-map-support/register";

import { BaseMetric, Metric } from "./metric";

export interface Gauge<T> extends Metric {
    getValue(): T;
}

export class SimpleGauge extends BaseMetric implements Gauge<number> {

    private value: number = 0;

    public constructor(name?: string) {
        super();
        this.name = name;
    }

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

}
