import "reflect-metadata";
import "source-map-support/register";

import { Clock, Time } from "inspector-metrics";

export class MockedClock implements Clock {

    private currentTime: Time;

    public time(): Time {
        return this.currentTime;
    }

    public setCurrentTime(time: Time): void {
        this.currentTime = time;
    }

}
