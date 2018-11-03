import "source-map-support/register";

/**
 * A logger abstraction used in this library.
 *
 * @export
 * @interface Logger
 */
export interface Logger {
    /**
     * Logs at "error" level:
     * - the first argument passed is usually the log message
     * - usually logs to stderr stream
     */
    error: (...args: any[]) => any;
    /**
     * Logs at "warn" level:
     * - the first argument passed is usually the log message
     * - usually logs to stdout stream
     */
    warn: (...args: any[]) => any;
    /**
     * Logs at "info" level:
     * - the first argument passed is usually the log message
     * - usually logs to stdout stream
     */
    info: (...args: any[]) => any;
    /**
     * Logs at "debug" level:
     * - the first argument passed is usually the log message
     * - usually logs to stdout stream
     * - available since node 8
     */
    debug: (...args: any[]) => any;
    /**
     * Logs at "trace" level:
     * - the first argument passed is usually the log message
     * - usually logs to stdout stream
     */
    trace: (...args: any[]) => any;
}
