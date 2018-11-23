import { Event } from "../../event";

export interface IEventReporter<TEventData, TResult> {
  start(): this;
  stop(): Promise<void>;
  report(event: Event<TEventData>): Promise<TResult>;
}
