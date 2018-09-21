import "source-map-support/register";

/**
 * A logger abstraction used in this library.
 *
 * @export
 * @interface Logger
 */
export interface Logger {
    error: (...args: any[]) => any;
    warn: (...args: any[]) => any;
    info: (...args: any[]) => any;
    debug: (...args: any[]) => any;
}
