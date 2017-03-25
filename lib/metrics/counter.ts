
import "source-map-support/register";

import { Counting } from "./counting";
import { Metric } from "./metric";
import { Taggable } from "./taggable";

export class Counter extends Taggable implements Counting, Metric {

    private count: number = 0;

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
