import "source-map-support";

/**
 * List of values between 0 and 1 representing the percent boundaries for reporting.
 *
 * @export
 * @class Percentiles
 */
export class Percentiles {
    /**
     * Name constant for assigning an instance of this class as metadata to a metric instance.
     *
     * @static
     * @memberof Percentiles
     */
    public static readonly METADATA_NAME = "quantiles";
    /**
     * Creates an instance of Percentiles.
     *
     * @param {number[]} [boundaries=[0.01, 0.05, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.999]]
     * @memberof Percentiles
     */
    constructor(public boundaries: number[] = [0.01, 0.05, 0.5, 0.75, 0.9, 0.95, 0.98, 0.99, 0.999]) {
        boundaries.sort((a: number, b: number) => a - b);
        boundaries.forEach((boundary) => {
            if (boundary <= 0.0) {
                throw new Error("boundaries cannot be smaller or equal to 0.0");
            }
            if (boundary >= 1.0) {
                throw new Error("boundaries cannot be greater or equal to 1.0");
            }
        });
    }
}
