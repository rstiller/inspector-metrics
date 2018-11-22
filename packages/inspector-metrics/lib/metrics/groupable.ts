import "source-map-support/register";

/**
 * Name-based (string) grouping interface - the group as metadata
 * of a metric is used in some metric-reporter.
 *
 * @export
 * @interface Groupable
 */
export interface Groupable {

    /**
     * Gets the group name.
     *
     * @returns {string}
     * @memberof Groupable
     */
    getGroup(): string;

    /**
     * Sets the group name.
     *
     * @param {string} group the new group name
     * @returns {this}
     * @memberof Groupable
     */
    setGroup(group: string): this;

}
