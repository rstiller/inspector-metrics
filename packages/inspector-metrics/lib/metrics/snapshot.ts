import "source-map-support/register";

/**
 * A static state of a collection of values.
 *
 * @export
 * @interface Snapshot
 */
export interface Snapshot {

    /**
     * Gets the value of 75% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    get75thPercentile(): number;

    /**
     * Gets the value of 95% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    get95thPercentile(): number;

    /**
     * Gets the value of 98% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    get98thPercentile(): number;

    /**
     * Gets the value of 99.9% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    get999thPercentile(): number;

    /**
     * Gets the value of 99% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    get99thPercentile(): number;

    /**
     * Gets the value of 50% boundary.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    getMedian(): number;

    /**
     * Gets the maximum value.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    getMax(): number;

    /**
     * Gets the minimum value.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    getMin(): number;

    /**
     * Gets all values.
     *
     * @returns {number[]}
     * @memberof Snapshot
     */
    getValues(): number[];

    /**
     * Gets the number of values.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    size(): number;

    /**
     * Gets the average of all values.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    getMean(): number;

    /**
     * Gets the average deviation among the values.
     *
     * @returns {number}
     * @memberof Snapshot
     */
    getStdDev(): number;

    /**
     * Gets the value of boundary specified.
     *
     * @param {number} quantile
     * @returns {number}
     * @memberof Snapshot
     */
    getValue(quantile: number): number;

}

/**
 * Default implementation of the {@link Snapshot} interface.
 *
 * @export
 * @class SimpleSnapshot
 * @implements {Snapshot}
 */
export class SimpleSnapshot implements Snapshot {

    /**
     * Sorted collection of values.
     *
     * @private
     * @type {number[]}
     * @memberof SimpleSnapshot
     */
    private values: number[] = [];

    /**
     * Creates an instance of SimpleSnapshot.
     *
     * @param {number[]} values
     * @memberof SimpleSnapshot
     */
    public constructor(values: number[]) {
        this.values = values.slice(0, values.length);
        this.values = this.values.sort((a, b) => a - b);
    }

    /**
     * Calls getValue(0.75) to get the value of the 75% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public get75thPercentile(): number {
        return this.getValue(0.75);
    }

    /**
     * Calls getValue(0.95) to get the value of the 95% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public get95thPercentile(): number {
        return this.getValue(0.95);
    }

    /**
     * Calls getValue(0.98) to get the value of the 98% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public get98thPercentile(): number {
        return this.getValue(0.98);
    }

    /**
     * Calls getValue(0.999) to get the value of the 99.9% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public get999thPercentile(): number {
        return this.getValue(0.999);
    }

    /**
     * Calls getValue(0.99) to get the value of the 99% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public get99thPercentile(): number {
        return this.getValue(0.99);
    }

    /**
     * Calls getValue(0.5) to get the value of the 50% boundary
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getMedian(): number {
        return this.getValue(0.5);
    }

    /**
     * Gets the last value of the value array.
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getMax(): number {
        return this.values[this.values.length - 1];
    }

    /**
     * Gets the first value of the value array.
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getMin(): number {
        return this.values[0];
    }

    /**
     * Gets the value array.
     *
     * @returns {number[]}
     * @memberof SimpleSnapshot
     */
    public getValues(): number[] {
        return this.values;
    }

    /**
     * Gets the length of the value array.
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public size(): number {
        return this.values.length;
    }

    /**
     * Gets average value of the value array.
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getMean(): number {
        if (this.values.length === 0) {
            return 0;
        }

        let sum = 0;
        this.values.forEach((value) => sum += value);
        return sum / this.values.length;
    }

    /**
     * Gets the average deviation among the values.
     *
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getStdDev(): number {
        if (this.values.length === 0) {
            return 0;
        }

        const mean = this.getMean();
        let sum = 0;
        this.values.forEach((value) => {
            const diff = value - mean;
            sum += diff * diff;
        });

        return Math.sqrt(sum / (this.values.length - 1));
    }

    /**
     * Gets the value of the boundary specified.
     *
     * E.g. considering the following values (sorted): [12, 20, 22, 25, 30, 32, 40, 50, 55, 56]
     *
     * quantile | position / index | value
     *
     * 0.25 | 3 | 24.25
     *
     * 0.5 | 5 | 36
     *
     * 0.75 | 8 | 51,25
     *
     * 0.95 | 10 | NaN
     *
     * @param {number} quantile
     * @returns {number}
     * @memberof SimpleSnapshot
     */
    public getValue(quantile: number): number {
        if (quantile < 0.0 || quantile > 1.0 || isNaN(quantile)) {
            return NaN;
        }

        if (this.values.length === 0) {
            return 0;
        }

        const pos = quantile * (this.values.length + 1);
        const index = Math.round(pos);

        if (index < 1) {
            return this.getMin();
        } else if (index >= this.values.length) {
            return this.getMax();
        }

        const lower = this.values[index - 1];
        const upper = this.values[index];
        return lower + (pos - Math.floor(pos)) * (upper - lower);
    }

}
