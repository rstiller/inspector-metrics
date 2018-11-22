import "source-map-support/register";

import { Groupable } from "./groupable";
import { MetadataContainer } from "./metadata-container";
import { MetadataManager } from "./metadata-manager";
import { TagManager } from "./tag-manager";
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
     * @returns {ThisType}
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
     * @returns {ThisType}
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
     * @type {TagManager}
     * @memberof BaseMetric
     */
    protected tagManager = new TagManager();

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
     * @type {MetadataManager}
     * @memberof BaseMetric
     */
    private metadataManager = new MetadataManager();

    public getMetadataMap(): Map<string, any> {
        return this.metadataManager.getMetadataMap();
    }

    public getMetadata<T>(name: string): T {
        return this.metadataManager.getMetadata<T>(name);
    }

    public removeMetadata<T>(name: string): T {
        return this.metadataManager.removeMetadata<T>(name);
    }

    public setMetadata<T>(name: string, value: T): this {
        this.metadataManager.setMetadata(name, value);
        return this;
    }

    public getTags(): Map<string, string> {
        return this.tagManager.getTags();
    }

    public getTag(name: string): string {
        return this.tagManager.getTag(name);
    }

    public setTag(name: string, value: string): this {
        this.tagManager.setTag(name, value);
        return this;
    }

    public removeTag(name: string): this {
        this.tagManager.removeTag(name);
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

    public toString(): string {
        if (this.group) {
            return `${this.group}.${this.name}`;
        }
        return this.name;
    }

}
