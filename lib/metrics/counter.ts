import "source-map-support/register";

import { Counting } from "./counting";
import { BaseMetric, Metric } from "./metric";

/**
 * A monotonically increasing number.
 * The initial value is 0.
 *
 * @export
 * @class MonotoneCounter
 * @extends {BaseMetric}
 * @implements {Counting}
 * @implements {Metric}
 */
export class MonotoneCounter extends BaseMetric implements Counting, Metric {

    /**
     * Holds the current value.
     *
     * @private
     * @type {number}
     * @memberof MonotoneCounter
     */
    protected count: number = 0;

    /**
     * Creates an instance of MonotoneCounter.
     *
     * @param {string} [name] optional name of the counter
     * @param {string} [description] optional description of the counter
     * @memberof MonotoneCounter
     */
    public constructor(name?: string, description?: string) {
        super();
        this.name = name;
        this.description = description;
    }

    /**
     * Increases the current count by the given value - a negative value is causing an error.
     *
     * @param {number} value
     * @memberof MonotoneCounter
     */
    public increment(value: number): void {
        if (value < 0) {
            throw new Error("MonotoneCounter must not be increased by a negative value");
        }
        this.count += value;
    }

    /**
     * Gets the current count.
     *
     * @returns {number}
     * @memberof MonotoneCounter
     */
    public getCount(): number {
        return this.count;
    }

    /**
     * Sets the current count to 0.
     *
     * @memberof MonotoneCounter
     */
    public reset(): void {
        this.count = 0;
    }

}

/**
 * A counter represents a number that can be increased or decreased in steps.
 * The initial value is 0.
 *
 * @export
 * @class Counter
 * @extends {MonotoneCounter}
 * @implements {Counting}
 * @implements {Metric}
 */
export class Counter extends MonotoneCounter implements Counting, Metric {

    /**
     * Creates an instance of Counter.
     *
     * @param {string} [name] optional name of the counter
     * @param {string} [description] optional description of the counter
     * @memberof Counter
     */
    public constructor(name?: string, description?: string) {
        super(name, description);
    }

    /**
     * Increases the current count by the given value - a negative value is decreasing the current count.
     *
     * @param {number} value
     * @memberof MonotoneCounter
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

}
