
import "source-map-support/register";

export class TimeUnit {

    private nanosecondsPerUnit: number;

    public constructor(nanosecondsPerUnit: number) {
        this.nanosecondsPerUnit = nanosecondsPerUnit;
    }

    public getNanosecondsPerUnit(): number {
        return this.nanosecondsPerUnit;
    }

    public convertTo(value: number, unit: TimeUnit): number {
        return (value * this.nanosecondsPerUnit) / unit.nanosecondsPerUnit;
    }

}

export const NANOSECOND = new TimeUnit(1);
export const MICROSECOND = new TimeUnit(1000);
export const MILLISECOND = new TimeUnit(1000000);
export const SECOND = new TimeUnit(1000000000);
export const MINUTE = new TimeUnit(60000000000);
export const HOUR = new TimeUnit(3600000000000);
export const DAY = new TimeUnit(86400000000000);
