
import "source-map-support/register";

import { Metric } from "./metric";
import { Taggable } from "./taggable";

export interface Gauge<T> extends Metric, Taggable {
    getValue(): T;
}

export class SimpleGauge extends Taggable implements Gauge<number> {

    private value: number = 0;

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number): void {
        this.value = value;
    }

}
