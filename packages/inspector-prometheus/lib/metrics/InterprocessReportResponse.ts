import "source-map-support";

import { InterprocessMessage } from "inspector-metrics";

/**
 * A message send from forked processes to the master process as response
 * to a metric-request-message.
 *
 * @export
 * @interface InterprocessReportResponse
 * @extends {InterprocessMessage}
 */
export interface InterprocessReportResponse extends InterprocessMessage {
    /**
     * Copy of the id from the request message.
     *
     * @type {string}
     * @memberof InterprocessReportResponse
     */
    readonly id: string;
    /**
     * The rendered metrics-string.
     *
     * @type {string}
     * @memberof InterprocessReportResponse
     */
    readonly metricsStr: string;
}
