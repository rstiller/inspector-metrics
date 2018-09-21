import "source-map-support/register";

import { Groupable } from "./groupable";
import { Taggable } from "./taggable";

/**
 * Representation for a metrics.
 *
 * @export
 * @interface Metric
 * @extends {Groupable}
 * @extends {Taggable}
 */
export interface Metric extends Groupable, Taggable {

    /**
     * Gets the name of the metric.
     *
     * @returns {string}
     * @memberof Metric
     */
    getName(): string;

    /**
     * Sets the name of the metric.
     *
     * @param {string} name
     * @memberof Metric
     */
    setName(name: string): void;

}

/**
 * Abstract base-class for a metric which implements commonly needed functions:
 * - get / set name
 * - get / set tags
 * - get / set group
 *
 * @export
 * @abstract
 * @class BaseMetric
 * @implements {Metric}
 */
export abstract class BaseMetric implements Metric {

    /**
     * A static number instance to give an unique id with an application instance.
     *
     * @private
     * @static
     * @memberof BaseMetric
     */
    private static COUNTER = 0;

    /**
     * The unique id of this metric instance.
     *
     * @type {number}
     * @memberof BaseMetric
     */
    public readonly id: number = BaseMetric.COUNTER++;
    /**
     * Maps of tags for this metric.
     *
     * @protected
     * @type {Map<string, string>}
     * @memberof BaseMetric
     */
    protected tags: Map<string, string> = new Map();
    /**
     * The group set to this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    protected group: string;
    /**
     * The name of this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    protected name: string;

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getGroup(): string {
        return this.group;
    }

    public setGroup(group: string): void {
        this.group = group;
    }

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public getTag(name: string): string {
        return this.tags.get(name);
    }

    public setTag(name: string, value: string): void {
        this.tags.set(name, value);
    }

    public removeTag(name: string): void {
        this.tags.delete(name);
    }

    public toString(): string {
        if (this.group) {
            return `${this.group}.${this.name}`;
        }
        return this.name;
    }

}
