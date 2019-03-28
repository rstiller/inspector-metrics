import "source-map-support/register";

import { Worker } from "cluster";

/**
 * Interface for abstracting event-emitter.
 *
 * @export
 * @interface ReportMessageReceiver
 */
export interface ReportMessageReceiver {
    /**
     * Receives an event with a message-type-id and payload. The specified callback gets
     * invoked if a message is received.
     *
     * @param {string} messageType - usually 'message'
     * @param {(worker: Worker, message: any, handle: any) => any} callback
     * @returns {*}
     * @memberof ReportMessageReceiver
     */
    on(messageType: string, callback: (worker: Worker, message: any, handle: any) => any): any;
}
