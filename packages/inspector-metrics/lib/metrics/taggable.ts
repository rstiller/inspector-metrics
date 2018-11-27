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
     * @returns {this}
     * @memberof Taggable
     */
    setTag(name: string, value: string): this;

    /**
     * Sets tags set.
     *
     * @param {Map<string, string>} name
     * @returns {this}
     * @memberof Taggable
     */
    setTags(tags: Map<string, string>): this;

    /**
     * Adds the specified tags to metric's tags.
     *
     * @param {Map<string, string>} name
     * @returns {this}
     * @memberof Taggable
     */
    addTags(tags: Map<string, string>): this;

    /**
     * Removes the specified tag.
     *
     * @param {string} name
     * @returns {this}
     * @memberof Taggable
     */
    removeTag(name: string): this;

    /**
     * Removes the specified tag names.
     *
     * @param {string[]} names
     * @returns {this}
     * @memberof Taggable
     */
    removeTags(...names: string[]): this;

}
