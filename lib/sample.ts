import "source-map-support/register";

import { Event } from "./metrics/event";
import { LoggerReporter } from "./metrics/reporter/events/logger-reporter";

const reporter = new LoggerReporter({});

reporter.start();

reporter.report(new Event<string>("test"));

reporter.stop();
