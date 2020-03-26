import 'source-map-support'

import { InterprocessMessage } from 'inspector-metrics'

/**
 * A message send from master process to forked processes in order
 * to get a response message with a metrics-string.
 *
 * @export
 * @interface InterprocessReportRequest
 * @extends {InterprocessMessage}
 */
export interface InterprocessReportRequest extends InterprocessMessage {
  /**
   * A unique id used to identify responses send back from forked processes.
   *
   * @type {string}
   * @memberof InterprocessReportRequest
   */
  readonly id: string
}
