import "source-map-support/register";

export interface Logger {
    error: (...args: any[]) => any;
    warn: (...args: any[]) => any;
    info: (...args: any[]) => any;
    debug: (...args: any[]) => any;
}
