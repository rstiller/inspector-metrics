import "source-map-support/register";

import { Counting } from "./counting";
import { BaseMetric, Metric } from "./metric";

/**
 * A counter represents a number that can be increased or decreased in steps.
 * The initial value is 0.
 *
 * @export
 * @class Counter
 * @extends {BaseMetric}
 * @implements {Counting}
 * @implements {Metric}
 */
export class Counter extends BaseMetric implements Counting, Metric {

    /**
     * Holds the current value.
     *
     * @private
     * @type {number}
     * @memberof Counter
     */
    private count: number = 0;

    /**
     * Creates an instance of Counter.
     *
     * @param {string} [name] optional name of the counter
     * @memberof Counter
     */
    public constructor(name?: string) {
        super();
        this.name = name;
    }

    /**
     * Increases the current count by the given value - a negative value is decreasing the current count.
     *
     * @param {number} value
     * @memberof Counter
     */
    public increment(value: number): void {
        this.count += value;
    }

    /**
     * Decreases the current count by the given value - a negative value is increasing the current count.
     *
     * @param {number} value
     * @memberof Counter
     */
    public decrement(value: number): void {
        this.count -= value;
    }

    /**
     * Gets the current count.
     *
     * @returns {number}
     * @memberof Counter
     */
    public getCount(): number {
        return this.count;
    }

    /**
     * Sets the current count to 0.
     *
     * @memberof Counter
     */
    public reset(): void {
        this.count = 0;
    }

}
