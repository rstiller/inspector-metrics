import "source-map-support/register";

import { SimpleSnapshot, Snapshot } from "./snapshot";

/**
 * Represents a collection of values.
 *
 * @export
 * @interface Reservoir
 */
export interface Reservoir {

    /**
     * Gets the capacity of this reservoir.
     *
     * @returns {number}
     * @memberof Reservoir
     */
    size(): number;

    /**
     * Adds a value to the reservoir.
     *
     * @param {number} value
     * @returns {this}
     * @memberof Reservoir
     */
    update(value: number): this;

    /**
     * Creates a new snapshot of this reservoir.
     *
     * @returns {Snapshot}
     * @memberof Reservoir
     */
    snapshot(): Snapshot;

}

/**
 * Simple implementation of a reservoir.
 * It has a maximum number of values, if the maximum
 * is reached old values are replaced by new values.
 *
 * @export
 * @class DefaultReservoir
 * @implements {Reservoir}
 */
export class DefaultReservoir implements Reservoir {

    /**
     * The values.
     *
     * @private
     * @type {number[]}
     * @memberof DefaultReservoir
     */
    private values: number[] = [];
    /**
     * The capacity of this reservoir.
     *
     * @private
     * @type {number}
     * @memberof DefaultReservoir
     */
    private maxSize: number;

    /**
     * Creates an instance of DefaultReservoir.
     *
     * @param {number} maxSize
     * @memberof DefaultReservoir
     */
    public constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    /**
     * Gets the actual number of value, but at max the specified maximum.
     *
     * @returns {number}
     * @memberof DefaultReservoir
     */
    public size(): number {
        return this.values.length;
    }

    /**
     * Adds the value to the array of numbers until the maximum number of
     * values is reached. If the maximum number of values is reached
     * an old value at a random position is replaced with the specified value.
     *
     * @param {number} value
     * @returns {this}
     * @memberof DefaultReservoir
     */
    public update(value: number): this {
        if (this.values.length < this.maxSize) {
            this.values.push(value);
        } else {
            const randomIndex: number = Math.round(Math.random() * this.values.length);
            this.values[randomIndex % this.values.length] = value;
        }
        return this;
    }

    /**
     * Creates a new snapshot instance.
     *
     * @returns {Snapshot}
     * @memberof DefaultReservoir
     */
    public snapshot(): Snapshot {
        return new SimpleSnapshot(this.values);
    }

}

/**
 * A reservoir that keeps the order of values and restarts
 * at the beginning if the maximum number of values is reached.
 *
 * @export
 * @class SlidingWindowReservoir
 * @implements {Reservoir}
 */
export class SlidingWindowReservoir implements Reservoir {

    /**
     * The values.
     *
     * @private
     * @type {number[]}
     * @memberof SlidingWindowReservoir
     */
    private values: number[] = [];
    /**
     * The capacity of the reservoir.
     *
     * @private
     * @type {number}
     * @memberof SlidingWindowReservoir
     */
    private maxSize: number;
    /**
     * The current index in the value array.
     *
     * @private
     * @type {number}
     * @memberof SlidingWindowReservoir
     */
    private index: number = 0;

    /**
     * Creates an instance of SlidingWindowReservoir.
     *
     * @param {number} maxSize
     * @memberof SlidingWindowReservoir
     */
    public constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    /**
     * Gets the number of values, but at may the capacity of the reservoir.
     *
     * @returns {number}
     * @memberof SlidingWindowReservoir
     */
    public size(): number {
        return this.values.length;
    }

    /**
     * Adds the value to the array of values until the capacity
     * of the reservoir is reached. If the maximum number of
     * values is reached, the insertion restarts at the beginning.
     *
     * @param {number} value
     * @returns {this}
     * @memberof SlidingWindowReservoir
     */
    public update(value: number): this {
        if (this.values.length < this.maxSize) {
            this.values.push(value);
        } else {
            this.values[this.index++ % this.values.length] = value;
        }
        return this;
    }

    /**
     * Creates a new snapshot using the values array.
     *
     * @returns {Snapshot}
     * @memberof SlidingWindowReservoir
     */
    public snapshot(): Snapshot {
        return new SimpleSnapshot(this.values);
    }

}
