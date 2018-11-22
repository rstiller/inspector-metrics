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
