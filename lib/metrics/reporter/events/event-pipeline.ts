import { Event } from "../../event";

export interface IEventPipeline<TIn, TOut> {
  push(events: Array<Event<TIn>>): Promise<TOut>;
  flush(): Promise<void>;
}
