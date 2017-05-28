import "source-map-support/register";

import { Metric } from "./metric";

export interface Counting extends Metric {
    getCount(): number;
}
