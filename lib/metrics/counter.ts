import "source-map-support/register";

import { Counting } from "./counting";
import { BaseMetric, Metric } from "./metric";

export class Counter extends BaseMetric implements Counting, Metric {

    private count: number = 0;

    public constructor(name?: string) {
        super();
        this.name = name;
    }

    public increment(value: number): void {
        this.count += value;
    }

    public decrement(value: number): void {
        this.count -= value;
    }

    public getCount(): number {
        return this.count;
    }

    public reset(): void {
        this.count = 0;
    }

}
