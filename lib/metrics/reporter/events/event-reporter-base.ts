import { Logger } from "../logger";

export interface EventReporterOptions {
  log?: Logger;
}

export abstract class EventReporterBase<O extends EventReporterOptions> {
  protected readonly options: O;

  public constructor(options: O) {
    this.options = options;
  }
}
