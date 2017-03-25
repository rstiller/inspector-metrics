
import "source-map-support/register";

import { Counting } from "./counting";
import { Metric } from "./metric";
import { Reservoir } from "./reservoir";
import { Sampling } from "./sampling";
import { Snapshot } from "./snapshot";
import { Taggable } from "./taggable";

export class Histogram extends Taggable implements Counting, Metric, Sampling {

    private reservoir: Reservoir;
    private count: number = 0;

    public constructor(reservoir: Reservoir) {
        super();
        this.reservoir = reservoir;
    }

    public update(value: number): void {
        this.count += 1;
        this.reservoir.update(value);
    }

    public getSnapshot(): Snapshot {
        return this.reservoir.snapshot();
    }

    public getCount(): number {
        return this.count;
    }

}
