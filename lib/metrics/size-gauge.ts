import "source-map-support/register";

import { Gauge } from "./gauge";
import { BaseMetric } from "./metric";

/**
 * Accessor-interface for objects with "length()" method.
 *
 * @export
 * @interface LengthMethodInterface
 */
export interface LengthMethodInterface {
    length(): number;
}

/**
 * Accessor-interface for objects with "length" attribute (e.g. Array).
 *
 * @export
 * @interface LengthAttributeInterface
 */
export interface LengthAttributeInterface {
    length: number;
}

/**
 * Accessor-interface for objects with "size" method.
 *
 * @export
 * @interface SizeMethodInterface
 */
export interface SizeMethodInterface {
    size(): number;
}

/**
 * Accessor-interface for objects with "size" attribute (e.g. Map, Set).
 *
 * @export
 * @interface SizeAttributeInterface
 */
export interface SizeAttributeInterface {
    size: number;
}

type ValueExtractor = () => number;

/**
 * Gets the current size / length of an object as gauge metric.
 *
 * @export
 * @class SizeGauge
 * @extends {BaseMetric}
 * @implements {Gauge<number>}
 */
export class SizeGauge extends BaseMetric implements Gauge<number> {

    /**
     * Checks if the specified collection is a {link LengthAttributeInterface}.
     *
     * @protected
     * @static
     * @param {*} collection
     * @returns {collection is LengthAttributeInterface}
     * @memberof SizeGauge
     */
    protected static isLengthAttributeInterface(collection: any): collection is LengthAttributeInterface {
        return collection && typeof collection.length === "number";
    }

    /**
     * Checks if the specified collection is a {link LengthMethodInterface}.
     *
     * @protected
     * @static
     * @param {*} collection
     * @returns {collection is LengthMethodInterface}
     * @memberof SizeGauge
     */
    protected static isLengthMethodInterface(collection: any): collection is LengthMethodInterface {
        return collection && typeof collection.length === "function";
    }

    /**
     * Checks if the specified collection is a {link SizeAttributeInterface}.
     *
     * @protected
     * @static
     * @param {*} collection
     * @returns {collection is SizeAttributeInterface}
     * @memberof SizeGauge
     */
    protected static isSizeAttributeInterface(collection: any): collection is SizeAttributeInterface {
        return collection && typeof collection.size === "number";
    }

    /**
     * Checks if the specified collection is a {link SizeMethodInterface}.
     *
     * @protected
     * @static
     * @param {*} collection
     * @returns {collection is SizeMethodInterface}
     * @memberof SizeGauge
     */
    protected static isSizeMethodInterface(collection: any): collection is SizeMethodInterface {
        return collection && typeof collection.size === "function";
    }

    /**
     * Gets the actual value for the collection passed to the constructor.
     *
     * @private
     * @type {ValueExtractor}
     * @memberof SizeGauge
     */
    private extractor: ValueExtractor;

    /**
     * Creates an instance of SizeGauge.
     *
     * @param {string} name The name of the metric
     * @param collection The collection to get the size / length from.
     * @param {string} [description] The description of the metric
     * @memberof SizeGauge
     */
    public constructor(
        name: string,
        collection: LengthAttributeInterface | LengthMethodInterface | SizeAttributeInterface | SizeMethodInterface,
        description?: string) {

        super();
        this.setName(name);
        this.setDescription(description);

        if (SizeGauge.isLengthAttributeInterface(collection)) {
            this.extractor = () => collection.length;
        } else if (SizeGauge.isLengthMethodInterface(collection)) {
            this.extractor = () => collection.length();
        } else if (SizeGauge.isSizeAttributeInterface(collection)) {
            this.extractor = () => collection.size;
        } else if (SizeGauge.isSizeMethodInterface(collection)) {
            this.extractor = () => collection.size();
        } else {
            this.extractor = () => -1;
        }
    }

    /**
     * Reports the size / length of the collection.
     *
     * @returns {number} Returns the current size of the collection or -1.
     * @memberof SizeGauge
     */
    public getValue(): number {
        return this.extractor();
    }

}
