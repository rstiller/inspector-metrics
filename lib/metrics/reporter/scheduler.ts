/**
 * Scheduler function type definition.
 */
export type Scheduler = (prog: () => Promise<any>, interval: number) => NodeJS.Timer;
