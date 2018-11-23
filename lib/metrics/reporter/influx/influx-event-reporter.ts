// import { Event } from "../../event";
// import { InfluxDB, ISingleHostConfig } from "influx";
// import { ScheduledEventReporter } from "../events/scheduled-event-reporter";
// import { IEventPipeline } from "../events/event-pipeline";

// //  TODO support both config interfaces
// type Config = ISingleHostConfig/* | IClusterConfig*/;
// type EventDataType = { [key: string]: number | string | boolean };

// function pipelineFactory(config: Config): IEventPipeline<EventDataType, void> {
//   const influx = new InfluxDB(config);
//   //     const adapter = new InfluxEventAdapter();

//   return {
//     push(events: Array<Event<EventDataType>>): Promise<void> {
//       //  TODO adapter
//       return influx.writePoints(events.map(_ => _.getValue()));
//     },
//     flush(): Promise<void> {
//       return Promise.resolve();
//     }
//   };
// }

// export class InfluxScheduledEventReporter extends ScheduledEventReporter<EventDataType, void> {
//   constructor(config: Config) {
//     super(() => pipelineFactory(config))
//   }
// }

// export class InfluxRealtimeEventReporter extends ScheduledEventReporter<EventDataType, void> {
//   constructor(config: Config) {
//     super(() => pipelineFactory(config))
//   }
// }

// // export class InfluxEventAdapter implements IAdapter<Event<EventDataType>, IPoint> {
// //   adapt(event: Event<EventDataType>): IPoint {
// //     const point: IPoint = {
// //       //  TODO take group into consideration
// //       measurement: event.getName(),
// //       tags: {},
// //       fields: event.getValue(),
// //       //  TODO make timestamp part of the event
// //       timestamp: Date.now(),
// //     };

// //     event.getTags().forEach((value, key) => point.tags[key] = value);

// //     return point;
// //   }
// // }

// // interface IPipeline<TIn, TOut> {
// //   push(element: TIn): Promise<TOut>;
// //   flush(): Promise<void>;
// // }

// // abstract class GenericEventReporter<TEventData, TResult> implements IEventReporter<TEventData, TResult> {
// //   private pipeline: IPipeline<Event<TEventData>, TResult>;

// //   public start(): this {
// //     if (this.pipeline) {
// //       throw new Error("The reporter has already been started");
// //     }
// //     else {
// //       this.pipeline = this.createPipeline();
// //       return this;
// //     }
// //   }

// //   //  TODO should return the promise
// //   public stop(): this {
// //     if (!this.pipeline) {
// //       throw new Error("The reporter has not been started yet");
// //     }
// //     else {
// //       const promise = this.pipeline.flush();
// //       promise
// //         .then(() => {
// //           this.pipeline = null;
// //         })
// //         .catch(error => {
// //           this.pipeline = null;
// //           throw error;
// //         });
// //       return this;
// //     }
// //   }

// //   public report(event: Event<TEventData>): Promise<TResult> {
// //     if (!this.pipeline) {
// //       throw new Error("The reporter should be started before calling the report method");
// //     }
// //     else {
// //       return this.pipeline.push(event);
// //     }
// //   }

// //   abstract createPipeline(): IPipeline<Event<TEventData>, TResult>;
// // }

// // class InfluxEventReporter2 extends GenericEventReporter<EventDataType, void> {
// //   private config: Config;

// //   constructor(config: Config) {
// //     super();
// //     this.config = config;
// //   }

// //   createPipeline(): IPipeline<Event<EventDataType>, void> {
// //     const influx = new InfluxDB(this.config);
// //     const adapter = new InfluxEventAdapter();

// //     return {
// //       push(event: Event<EventDataType>): Promise<void>{
// //         return influx.writePoints([
// //           adapter.adapt(event)
// //         ]);
// //       },
// //       flush(): Promise<void> {
// //         return Promise.resolve();
// //       }
// //     };
// //   }
// // }

// // export class InfluxEventReporter implements IEventReporter<EventDataType, void> {
// //   private influx: InfluxDB;
// //   private config: Config;

// //   // TODO : support both config
// //   constructor(config: Config) {
// //     this.config = config;
// //   }

// //   public start(): this {
// //     this.influx = new InfluxDB(this.config);
// //     return this;
// //   }

// //   public stop(): this {
// //     this.influx = null;
// //     return this;
// //   }

// //   public report(event: Event<EventDataType>): Promise<void> {
// //     return this.influx.writePoints([
// //       InfluxEventReporter.buildPoint(event)
// //     ]);
// //   }

// //   private static buildPoint(event: Event<IPoint>): IPoint {
// //     const point: IPoint = {
// //       //  TODO take group into consideration
// //       measurement: event.getName(),
// //       tags: {},
// //       fields: event.getValue(),
// //       //  TODO make timestamp part of the event
// //       timestamp: Date.now(),
// //     };

// //     event.getTags().forEach((value, key) => point.tags[key] = value);

// //     return point;
// //   }
// // }