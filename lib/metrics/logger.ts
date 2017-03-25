
import "source-map-support/register";

export interface Logger {
    log: Function;
    error: Function;
    warn: Function;
    info: Function;
    debug: Function;
}
