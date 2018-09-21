import "source-map-support/register";

import { Snapshot } from "./snapshot";

/**
 * Interface fo all metric classes that can build a snapshot of values.
 *
 * @export
 * @interface Sampling
 */
export interface Sampling {

    /**
     * Gets the snapshot of values.
     *
     * @returns {Snapshot}
     * @memberof Sampling
     */
    getSnapshot(): Snapshot;

}
