
import "source-map-support/register";

import { Snapshot } from "./snapshot";

export interface Sampling {
    getSnapshot(): Snapshot;
}
