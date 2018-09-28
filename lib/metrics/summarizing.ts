import "source-map-support/register";

/**
 * Interface fo all metric classes that build a sum of values.
 *
 * @export
 * @interface Summarizing
 */
export interface Summarizing {

    /**
     * Gets the sum of values.
     *
     * @returns {number}
     * @memberof Summarizing
     */
    getSum(): number;

}
