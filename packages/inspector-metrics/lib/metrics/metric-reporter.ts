import "source-map-support/register";

import { MetricRegistry } from "./metric-registry";

/**
 * Base-class for metric-reporter implementations.
 *
 * @export
 * @abstract
 * @class MetricReporter
 */
export abstract class MetricReporter {

    /**
     * {@link MetricRegistry} instances.
     *
     * @protected
     * @type {MetricRegistry[]}
     * @memberof MetricReporter
     */
    protected metricRegistries: MetricRegistry[] = [];

    /**
     * Implementations start reporting metrics when called.
     *
     * @abstract
     * @memberof MetricReporter
     */
    public abstract start(): void;

    /**
     * Implementations stop reporting metrics when called.
     *
     * @abstract
     * @memberof MetricReporter
     */
    public abstract stop(): void;

    /**
     * Adds a new {@link MetricRegistry} to be reported.
     *
     * @param {MetricRegistry} metricRegistry
     * @memberof MetricReporter
     */
    public addMetricRegistry(metricRegistry: MetricRegistry): void {
        this.metricRegistries.push(metricRegistry);
    }

    /**
     * Removes the given {@link MetricRegistry} if it was previously added.
     *
     * @param {MetricRegistry} metricRegistry
     * @memberof MetricReporter
     */
    public removeMetricRegistry(metricRegistry: MetricRegistry): void {
        const index: number = this.metricRegistries.indexOf(metricRegistry);
        if (index > -1) {
            this.metricRegistries.splice(index, 1);
        }
    }

}
