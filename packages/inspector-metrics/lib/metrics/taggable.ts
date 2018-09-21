import "source-map-support/register";

/**
 * An interface for taggable classes.
 *
 * @export
 * @interface Taggable
 */
export interface Taggable {

    /**
     * Gets all tags.
     *
     * @returns {Map<string, string>}
     * @memberof Taggable
     */
    getTags(): Map<string, string>;

    /**
     * Gets the specified tag or {@code null}.
     *
     * @param {string} name
     * @returns {string}
     * @memberof Taggable
     */
    getTag(name: string): string;

    /**
     * Sets the specified tag.
     *
     * @param {string} name
     * @param {string} value
     * @memberof Taggable
     */
    setTag(name: string, value: string): void;

    /**
     * Removes the specified tag.
     *
     * @param {string} name
     * @memberof Taggable
     */
    removeTag(name: string): void;

}
