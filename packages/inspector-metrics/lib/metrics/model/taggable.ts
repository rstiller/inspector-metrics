import "source-map-support/register";

/**
 * Helper interface for handling tags.
 */
export interface Tags {
    [key: string]: string;
}

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

/**
 * Transforms the {@link Tags} object into a {@link Map<string, string>} object.
 *
 * @export
 * @param {Tags} tags
 * @returns {Map<string, string>}
 */
export function tagsToMap(tags: Tags): Map<string, string> {
    const tagMap: Map<string, string> = new Map();
    if (tags) {
        Object.keys(tags).forEach((key) => tagMap.set(key, tags[key]));
    }
    return tagMap;
}

/**
 * Transforms the {@link Map<string, string>} object into a {@link Tags} object.
 *
 * @export
 * @param {Map<string, string>} tagMap
 * @returns {Tags}
 */
export function mapToTags(tagMap: Map<string, string>): Tags {
    const tags: Tags = {};
    if (tagMap) {
        tagMap.forEach((tag, name) => tags[name] = tag);
    }
    return tags;
}
