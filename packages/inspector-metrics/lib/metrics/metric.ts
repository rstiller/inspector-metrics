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
     * @returns {this}
     * @memberof Metric
     */
    setName(name: string): this;

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
     * @returns {this}
     * @memberof Metric
     */
    setDescription(description: string): this;

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
     * A static number instance to give an unique id within an application instance.
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

    public setMetadata<T>(name: string, value: T): this {
        this.metadata.set(name, value);
        return this;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): this {
        this.name = name;
        return this;
    }

    public getDescription(): string {
        return this.description;
    }

    public setDescription(description: string): this {
        this.description = description;
        return this;
    }

    public getGroup(): string {
        return this.group;
    }

    public setGroup(group: string): this {
        this.group = group;
        return this;
    }

    public getTags(): Map<string, string> {
        return this.tags;
    }

    public getTag(name: string): string {
        return this.tags.get(name);
    }

    public setTag(name: string, value: string): this {
        this.tags.set(name, value);
        return this;
    }

    public setTags(tags: Map<string, string>): this {
        this.tags = tags;
        return this;
    }

    public addTags(tags: Map<string, string>): this {
        tags.forEach((value, key) => this.tags.set(key, value));
        return this;
    }

    public removeTag(name: string): this {
        this.tags.delete(name);
        return this;
    }

    public removeTags(...names: string[]): this {
        names.forEach((name) => this.removeTag(name));
        return this;
    }

    public toString(): string {
        if (this.group) {
            return `${this.group}.${this.name}`;
        }
        return this.name;
    }

}
