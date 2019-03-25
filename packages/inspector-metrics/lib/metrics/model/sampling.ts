import "source-map-support/register";

import { SerializedSnapshot, SimpleSnapshot, Snapshot } from "./snapshot";

/**
 * Interface for all metric classes that can build a snapshot of values.
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

/**
 * Determines if the metric passed is a {@link SerializableSampling} or not.
 *
 * @export
 * @param {(Sampling | SerializableSampling)} metric
 * @returns {metric is SerializableSampling}
 */
export function isSerializableSampling(metric: Sampling | SerializableSampling): metric is SerializableSampling {
    const anyMetric: any = metric as any;
    if ((anyMetric.getSnapshot && typeof anyMetric.getSnapshot === "function")) {
        return false;
    }
    return anyMetric.hasOwnProperty("snapshot");
}

/**
 * Convenience method to get the snapshot of a {@link Sampling} or a {@link SerializableSampling}.
 *
 * @export
 * @param {(Sampling | SerializableSampling)} metric
 * @returns {Snapshot}
 */
export function getSnapshot(metric: Sampling | SerializableSampling): Snapshot {
    if (isSerializableSampling(metric)) {
        return new SimpleSnapshot(metric.snapshot.values);
    } else {
        return metric.getSnapshot();
    }
}
