import "source-map-support/register";

import { Metric } from "./metric";

export interface Metered extends Metric {
    getCount(): number;
    get15MinuteRate(): number;
    get5MinuteRate(): number;
    get1MinuteRate(): number;
    getMeanRate(): number;
}
