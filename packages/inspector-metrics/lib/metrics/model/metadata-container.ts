import "source-map-support/register";

/**
 * Interface for all classes that can associate metadata with instances.
 *
 * @export
 * @interface MetadataContainer
 */
export interface MetadataContainer {

    /**
     * Gets all the metadata associated with an instance.
     * Future changes to the metadata of this instance may
     * not be reflected in the map returned here.
     *
     * @returns {Map<string, any>}
     * @memberof MetadataContainer
     */
    getMetadataMap(): Map<string, any>;

    /**
     * Gets the metadata associated with the specified name.
     *
     * @template T
     * @param {string} name The metadata key
     * @returns {T}
     * @memberof MetadataContainer
     */
    getMetadata<T>(name: string): T;

    /**
     * Removes the metadata associated with the specified name and returns it finally.
     *
     * @template T
     * @param {string} name The metadata key
     * @returns {T}
     * @memberof MetadataContainer
     */
    removeMetadata<T>(name: string): T;

    /**
     * Sets the metadata object to the name.
     *
     * @template T
     * @param {string} name The key of the metadata
     * @param {T} value any value
     * @returns {this}
     * @memberof MetadataContainer
     */
    setMetadata<T>(name: string, value: T): this;
}

/**
 * Helper interface for handling metadata.
 */
export interface Metadata {
    [key: string]: any;
}

/**
 * Transforms the {@link Metadata} object into a {@link Map<string, any>} object.
 *
 * @export
 * @param {Metadata} metadata
 * @returns {Map<string, any>}
 */
export function metadataToMap(metadata: Metadata): Map<string, any> {
    const metadataMap: Map<string, any> = new Map();
    if (metadata) {
        Object.keys(metadata).forEach((key) => metadataMap.set(key, metadata[key]));
    }
    return metadataMap;
}

/**
 * Transforms the {@link Map<string, any>} object into a {@link Metadata} object.
 *
 * @export
 * @param {Map<string, any>} metadataMap
 * @returns {Metadata}
 */
export function mapToMetadata(metadataMap: Map<string, any>): Metadata {
    const metadata: Metadata = {};
    if (metadataMap) {
        metadataMap.forEach((value, name) => metadata[name] = value);
    }
    return metadata;
}
