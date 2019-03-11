import "source-map-support/register";

import { SerializedSnapshot, Snapshot } from "./snapshot";

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

/**
 * The serialized version of {@link Sampling}.
 *
 * @export
 * @interface SerializableSampling
 */
export interface SerializableSampling {

    /**
     * Gets the serialized, sorted collection of samples.
     *
     * @returns {SerializedSnapshot}
     * @memberof SerializableSampling
     */
    snapshot: SerializedSnapshot;

}
