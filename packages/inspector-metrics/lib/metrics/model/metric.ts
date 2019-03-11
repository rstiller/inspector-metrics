import "source-map-support/register";

import { Groupable } from "./groupable";
import { mapToMetadata, Metadata, MetadataContainer } from "./metadata-container";
import { mapToTags, Taggable, Tags } from "./taggable";

/**
 * Determines if the metric passed is a {@link SerializableMetric} or not.
 *
 * @export
 * @param {(Groupable | MetadataContainer | Taggable | Metric | SerializableMetric)} metric
 * @returns {metric is SerializableMetric}
 */
export function isSerializableMetric(
    metric: Groupable | MetadataContainer | Taggable | Metric | SerializableMetric): metric is SerializableMetric {
    const anyMetric: any = metric as any;
    if ((anyMetric.getGroup && typeof anyMetric.getGroup === "function") ||
        (anyMetric.getMetadataMap && typeof anyMetric.getMetadataMap === "function") ||
        (anyMetric.getTags && typeof anyMetric.getTags === "function") ||
        (anyMetric.getName && typeof anyMetric.getName === "function")) {
        return false;
    }
    return typeof anyMetric.name === "string";
}

/**
 * Convenience method the get the name of a {@link Metric} or a {@link SerializableMetric}.
 *
 * @export
 * @param {(Metric | SerializableMetric)} metric
 * @returns {string}
 */
export function getMetricName(metric: Metric | SerializableMetric): string {
    if (isSerializableMetric(metric)) {
        return metric.name;
    } else {
        return metric.getName();
    }
}

/**
 * Convenience method the get the description of a {@link Metric} or a {@link SerializableMetric}.
 *
 * @export
 * @param {(Metric | SerializableMetric)} metric
 * @returns {string}
 */
export function getMetricDescription(metric: Metric | SerializableMetric): string {
    if (isSerializableMetric(metric)) {
        return metric.description;
    } else {
        return metric.getDescription();
    }
}

/**
 * Convenience method the get the group of a {@link Metric} or a {@link SerializableMetric}.
 *
 * @export
 * @param {(Groupable | SerializableMetric)} metric
 * @returns {string}
 */
export function getMetricGroup(metric: Groupable | SerializableMetric): string {
    if (isSerializableMetric(metric)) {
        return metric.group;
    } else {
        return metric.getGroup();
    }
}

/**
 * Convenience method the get the tags of a {@link Metric} or a {@link SerializableMetric}.
 *
 * @export
 * @param {(Taggable | SerializableMetric)} metric
 * @returns {Tags}
 */
export function getMetricTags(metric: Taggable | SerializableMetric): Tags {
    if (isSerializableMetric(metric)) {
        return (metric.tags as any) as Tags;
    } else {
        return mapToTags(metric.getTags());
    }
}

/**
 * Convenience method the get the metadata of a {@link Metric} or a {@link SerializableMetric}.
 *
 * @export
 * @param {(MetadataContainer | SerializableMetric)} metric
 * @returns {Metadata}
 */
export function getMetricMetadata(metric: MetadataContainer | SerializableMetric): Metadata {
    if (isSerializableMetric(metric)) {
        return metric.metadata;
    } else {
        return mapToMetadata(metric.getMetadataMap());
    }
}

/**
 * Representation of a metric.
 *
 * @export
 * @interface Metric
 * @extends {Groupable}
 * @extends {MetadataContainer}
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
 * A {@link Metric} with public fields for convenient use after serialization.
 *
 * @export
 * @interface SerializableMetric
 * @extends {Metric}
 */
export interface SerializableMetric extends Metric {
    /**
     * Description of the metric.
     *
     * @type {string}
     * @memberof SerializableMetric
     */
    description: string;
    /**
     * Group of the metric.
     *
     * @type {string}
     * @memberof SerializableMetric
     */
    group: string;
    /**
     * Metadata map of the metric.
     * This field is serialized as an object.
     * {@link Metadata} would be a more suitable interface for this field,
     * but to be compatible with {@link BaseMetric} this is a Map.
     *
     * @type {Map<string, any>}
     * @memberof SerializableMetric
     */
    metadata: Map<string, any>;
    /**
     * name of the metric.
     *
     * @type {string}
     * @memberof SerializableMetric
     */
    name: string;
    /**
     * Tags of the metric.
     * This field is serialized as an object.
     * {@link Tags} would be a more suitable interface for this field,
     * but to be compatible with {@link BaseMetric} this is a Map.
     *
     * @type {Map<string, string>}
     * @memberof SerializableMetric
     */
    tags: Map<string, string>;
}

/**
 * Abstract base-class for a metric which implements commonly needed functions:
 * - get / set name
 * - get / set description
 * - get / set tags
 * - get / set metadta
 * - get / set group
 *
 * @export
 * @abstract
 * @class BaseMetric
 * @implements {Metric}
 * @implements {SerializableMetric}
 */
export abstract class BaseMetric implements Metric, SerializableMetric {

    /**
     * A static number instance to give an unique id within an application instance.
     * This counter is only unique per process, forked processes start from 0.
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
    public tags: Map<string, string> = new Map();
    /**
     * The group set to this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    public group: string;
    /**
     * The name of this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    public name: string;
    /**
     * The description of this metric.
     *
     * @protected
     * @type {string}
     * @memberof BaseMetric
     */
    public description: string;
    /**
     * The metadata associated with an instance of class.
     *
     * @protected
     * @type {Map<string, any>}
     * @memberof BaseMetric
     */
    public metadata: Map<string, any> = new Map();

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
