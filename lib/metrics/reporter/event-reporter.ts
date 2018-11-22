import { Event } from "../event";

export interface EventReporter {
  report<T>(event: Event<T>): this;
}
