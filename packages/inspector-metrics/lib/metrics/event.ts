import "source-map-support/register";

import { Gauge } from "./gauge";
import { BaseMetric } from "./metric";

/**
 * Represents an ad-hoc event which can directly be reported using the
 * {@link MetricReporter#reportEvent} method.
 * Events are treated as gauges with timestamp.
 *
 * @export
 * @class Event
 * @implements {Taggable}
 * @template TEventData
 */
export class Event<TEventData> extends BaseMetric implements Gauge<TEventData> {

    /**
     * The value of the event can be anything
     * MetricReporter instances can choose to support some value types or not.
     *
     * @private
     * @type {TEventData}
     * @memberof Event
     */
    private value: TEventData;
    /**
     * The time the event happened.
     *
     * @private
     * @type {Date}
     * @memberof Event
     */
    private time: Date;

    /**
     * Creates an instance of Event.
     *
     * @param {string} name the metric name of the event
     * @param {string} [description] optional description
     * @param {string} [group] optional group
     * @param {Date} [time=new Date()]
     *              can be set to <pre><code>new Date(clock.time().milliseconds)</code></pre>
     *              to be in line with orinary {@link MetricReporter} implementations.
     * @memberof Event
     */
    public constructor(name: string, description?: string, group?: string, time: Date = new Date()) {
        super();
        this.time = time;
        this.name = name;
        this.description = description;
        this.group = group;
    }

    /**
     * Gets the time.
     *
     * @returns {Date}
     * @memberof Event
     */
    public getTime(): Date {
        return this.time;
    }

    /**
     * Sets the time.
     *
     * @param {Date} time
     * @returns {this}
     * @memberof Event
     */
    public setTime(time: Date): this {
        this.time = time;
        return this;
    }

    /**
     * Gets the value of the event
     *
     * @returns {TEventData}
     * @memberof Event
     */
    public getValue(): TEventData {
        return this.value;
    }

    /**
     * Sets the value of the event.
     *
     * @param {TEventData} value
     * @returns {this}
     * @memberof Event
     */
    public setValue(value: TEventData): this {
        this.value = value;
        return this;
    }

    /**
     * Renders a string representing this event.
     *
     * @returns {string}
     * @memberof Event
     */
    public toString(): string {
        return this.name;
    }

}
