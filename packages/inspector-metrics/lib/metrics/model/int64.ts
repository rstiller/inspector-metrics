/**
 * native Int64 lib.
 */
const Int64 = require("node-cint64").Int64;

/**
 * Wrapper class for a native int64_t value.
 *
 * @export
 * @class Int64Wrapper
 */
export class Int64Wrapper {

    /**
     * int64_t value instance.
     *
     * @private
     * @type {*}
     * @memberof Int64Wrapper
     */
    private num: any;

    /**
     * Creates an instance of Int64Wrapper.
     *
     * @param {number} [initial=0]
     * @memberof Int64Wrapper
     */
    public constructor(initial: number = 0) {
        this.num = new Int64(initial);
    }

    /**
     * Adds the specified value.
     *
     * @param {number} value
     * @returns {this}
     * @memberof Int64Wrapper
     */
    public add(value: number): this {
        this.num = this.num.add(value);
        return this;
    }

    /**
     * Gets the 64bit value as javascript 32bit signed integer.
     *
     * @returns {number}
     * @memberof Int64Wrapper
     */
    public toNumber(): number {
        return this.num.toNumber();
    }

    /**
     * Converts the 64bit integer to it's string representation.
     *
     * @returns {string}
     * @memberof Int64Wrapper
     */
    public toString(): string {
        return this.num.toString();
    }

}
