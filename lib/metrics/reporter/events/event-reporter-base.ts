import { EventReporterOptions } from "./event-reporter-options";

export abstract class EventReporterBase<O extends EventReporterOptions> {
  private options: O;

  public constructor(options: O) {
    this.options = options;
  }

  public getOptions(): O {
    return this.options;
  }
}
