
import "source-map-support/register";

import { SimpleSnapshot, Snapshot } from "./snapshot";

export interface Reservoir {
    size(): number;
    update(value: number): void;
    snapshot(): Snapshot;
}

export class DefaultReservoir implements Reservoir {

    private values: number[] = [];
    private maxSize: number;

    public constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    public size(): number {
        return this.values.length;
    }

    public update(value: number): void {
        if (this.values.length < this.maxSize) {
            this.values.push(value);
        } else {
            const randomIndex: number = Math.round(Math.random() * this.values.length);
            this.values[randomIndex % this.values.length] = value;
        }
    }

    public snapshot(): Snapshot {
        return new SimpleSnapshot(this.values);
    }

}

export class SlidingWindowReservoir implements Reservoir {

    private values: number[] = [];
    private maxSize: number;
    private index: number = 0;

    public constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    public size(): number {
        return this.values.length;
    }

    public update(value: number): void {
        if (this.values.length < this.maxSize) {
            this.values.push(value);
        } else {
            this.values[this.index++ % this.values.length] = value;
        }
    }

    public snapshot(): Snapshot {
        return new SimpleSnapshot(this.values);
    }

}
