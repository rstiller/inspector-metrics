import "source-map-support/register";

import { Groupable } from "./groupable";
import { MetadataContainer } from "./metadata-container";
import { Taggable } from "./taggable";

/**
 * Representation for a metrics.
 *
 * @export
 * @interface Metric
 * @extends {Groupable}
 * @extends {Taggable}
 */
export interface Metric extends Groupable, MetadataContainer, Taggable {

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

    /**
     * Gets the description of the metric.
     *
     * @returns {string}
     * @memberof Metric
     */
    getDescription(): string;

    /**
     * Sets the description of the metric.
     *
     * @param {string} description
     * @memberof Metric
     */
    setDescription(description: string): void;

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
    /**
     * The description of this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    protected description: string;
    /**
     * The metadata associated with an instance of class.
     *
     * @protected
     * @type {Map<string, any>}
     * @memberof BaseMetric
     */
    protected metadata: Map<string, any> = new Map();

    public getMetadataMap(): Map<string, any> {
        return this.metadata;
    }

    public getMetadata<T>(name: string): T {
        return this.metadata.get(name) as T;
    }

    public removeMetadata<T>(name: string): T {
        const value = this.metadata.get(name) as T;
        this.metadata.delete(name);
        return value;
    }

    public setMetadata<T>(name: string, value: T): void {
        this.metadata.set(name, value);
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public getDescription(): string {
        return this.description;
    }

    public setDescription(description: string): void {
        this.description = description;
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
