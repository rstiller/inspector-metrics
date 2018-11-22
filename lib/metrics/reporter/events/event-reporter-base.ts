import { EventReporterOptions } from "./event-reporter-options";

export abstract class EventReporterBase<O extends EventReporterOptions> {
  protected readonly options: O;

  public constructor(options: O) {
    this.options = options;
  }
}
