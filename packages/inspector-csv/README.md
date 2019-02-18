# inspector-csv
Typescript metric reporter for CSV files.

<p align="center">
    <a href="https://www.npmjs.org/package/inspector-csv">
        <img src="https://img.shields.io/npm/v/inspector-csv.svg" alt="NPM Version">
    </a>
    <a href="https://www.npmjs.org/package/inspector-csv">
        <img src="https://img.shields.io/npm/l/inspector-csv.svg" alt="License">
    </a>
    <a href="https://travis-ci.org/rstiller/inspector-csv">
        <img src="http://img.shields.io/travis/rstiller/inspector-csv/master.svg" alt="Build Status">
    </a>
    <a href="https://david-dm.org/rstiller/inspector-csv">
        <img src="https://img.shields.io/david/rstiller/inspector-csv.svg" alt="Dependencies Status">
    </a>
</p>

This library is made for [inspector-metrics](https://github.com/rstiller/inspector-metrics)
node module and is meant to be used with `nodejs`.  

All metrics from the [inspector-metrics](https://github.com/rstiller/inspector-metrics) library
can exported into CSV files.

## install

`npm install --save inspector-csv`

## basic usage

`example.ts`
```typescript
import {
    CsvMetricReporter,
    DefaultCsvFileWriter,
} from "inspector-csv";
import { MetricRegistry, Timer } from "inspector-metrics";

// metric registry is used in the application code to measure durations, error codes, etc...
const registry: MetricRegistry = new MetricRegistry();

// some timers for this example
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
requests3.setTag("host", "127.0.0.3");

// default csv file writer
const writer = new DefaultCsvFileWriter({});

// configure CSV metric reporter instance
const reporter = new CsvMetricReporter({
    columns: ["date", "group", "name", "field", "value"],
    writer,
});

// register registry in the reporter
reporter.addMetricRegistry(registry);
// start reporting
reporter.start();

// simulate a running application which produces some custom measures
setInterval(() => requests1.time(() => { ... }), 100);
setInterval(() => requests2.time(() => { ... }), 50);
setInterval(() => requests3.time(() => { ... }), 25);
```

`201810201900_metrics.csv` (example output file)
```csv
date,group,name,field,value
20181020191953.380+00:00,"requests","requests1","bucket_0.005",0
20181020191953.380+00:00,"requests","requests1","bucket_0.01",0
20181020191953.380+00:00,"requests","requests1","bucket_0.025",0
20181020191953.380+00:00,"requests","requests1","bucket_0.05",0
20181020191953.380+00:00,"requests","requests1","bucket_0.1",0
20181020191953.380+00:00,"requests","requests1","bucket_0.25",0
20181020191953.380+00:00,"requests","requests1","bucket_0.5",0
20181020191953.380+00:00,"requests","requests1","bucket_1",0
20181020191953.380+00:00,"requests","requests1","bucket_2.5",0
20181020191953.380+00:00,"requests","requests1","bucket_5",0
20181020191953.380+00:00,"requests","requests1","bucket_10",0
20181020191953.380+00:00,"requests","requests1","bucket_inf",10
20181020191953.380+00:00,"requests","requests1","count",10
20181020191953.380+00:00,"requests","requests1","m15_rate",9
20181020191953.380+00:00,"requests","requests1","m1_rate",9
20181020191953.380+00:00,"requests","requests1","m5_rate",9
20181020191953.380+00:00,"requests","requests1","max",2999808
20181020191953.380+00:00,"requests","requests1","mean",1399961.6
20181020191953.380+00:00,"requests","requests1","mean_rate",6.622515994912551
20181020191953.380+00:00,"requests","requests1","min",999936
20181020191953.380+00:00,"requests","requests1","p50",999936
20181020191953.380+00:00,"requests","requests1","p75",2000128
20181020191953.380+00:00,"requests","requests1","p95",2999808
20181020191953.380+00:00,"requests","requests1","p98",2999808
20181020191953.380+00:00,"requests","requests1","p99",2999808
20181020191953.380+00:00,"requests","requests1","p999",2999808
20181020191953.380+00:00,"requests","requests1","stddev",699209.9735144262
20181020191953.380+00:00,"requests","requests1","sum",13999616
20181020191953.380+00:00,"requests","requests2","bucket_0.005",5
20181020191953.380+00:00,"requests","requests2","bucket_0.01",5
20181020191953.380+00:00,"requests","requests2","bucket_0.025",5
20181020191953.380+00:00,"requests","requests2","bucket_0.05",5
20181020191953.380+00:00,"requests","requests2","bucket_0.1",5
20181020191953.380+00:00,"requests","requests2","bucket_0.25",5
20181020191953.380+00:00,"requests","requests2","bucket_0.5",5
20181020191953.380+00:00,"requests","requests2","bucket_1",5
20181020191953.380+00:00,"requests","requests2","bucket_2.5",5
20181020191953.380+00:00,"requests","requests2","bucket_5",5
20181020191953.380+00:00,"requests","requests2","bucket_10",5
20181020191953.380+00:00,"requests","requests2","bucket_inf",20
20181020191953.380+00:00,"requests","requests2","count",20
20181020191953.380+00:00,"requests","requests2","m15_rate",19
20181020191953.380+00:00,"requests","requests2","m1_rate",19
20181020191953.380+00:00,"requests","requests2","m5_rate",19
20181020191953.380+00:00,"requests","requests2","max",2000128
20181020191953.380+00:00,"requests","requests2","mean",850022.4
20181020191953.380+00:00,"requests","requests2","mean_rate",13.227513227513228
20181020191953.380+00:00,"requests","requests2","min",0
20181020191953.380+00:00,"requests","requests2","p50",999936
20181020191953.380+00:00,"requests","requests2","p75",1000192
20181020191953.380+00:00,"requests","requests2","p95",2000128
20181020191953.380+00:00,"requests","requests2","p98",2000128
20181020191953.380+00:00,"requests","requests2","p99",2000128
20181020191953.380+00:00,"requests","requests2","p999",2000128
20181020191953.380+00:00,"requests","requests2","stddev",587171.928872124
20181020191953.380+00:00,"requests","requests2","sum",17000448
20181020191953.380+00:00,"","requests3","bucket_0.005",14
20181020191953.380+00:00,"","requests3","bucket_0.01",14
20181020191953.380+00:00,"","requests3","bucket_0.025",14
20181020191953.380+00:00,"","requests3","bucket_0.05",14
20181020191953.380+00:00,"","requests3","bucket_0.1",14
20181020191953.380+00:00,"","requests3","bucket_0.25",14
20181020191953.380+00:00,"","requests3","bucket_0.5",14
20181020191953.380+00:00,"","requests3","bucket_1",14
20181020191953.380+00:00,"","requests3","bucket_2.5",14
20181020191953.380+00:00,"","requests3","bucket_5",14
20181020191953.380+00:00,"","requests3","bucket_10",14
20181020191953.380+00:00,"","requests3","bucket_inf",40
20181020191953.380+00:00,"","requests3","count",40
20181020191953.380+00:00,"","requests3","m15_rate",38
20181020191953.380+00:00,"","requests3","m1_rate",38
20181020191953.380+00:00,"","requests3","m5_rate",38
20181020191953.380+00:00,"","requests3","max",2000128
20181020191953.380+00:00,"","requests3","mean",700012.8
20181020191953.380+00:00,"","requests3","mean_rate",26.455026455026456
20181020191953.380+00:00,"","requests3","min",0
20181020191953.380+00:00,"","requests3","p50",999936
20181020191953.380+00:00,"","requests3","p75",1000192
20181020191953.380+00:00,"","requests3","p95",2000115.2
20181020191953.380+00:00,"","requests3","p98",2000128
20181020191953.380+00:00,"","requests3","p99",2000128
20181020191953.380+00:00,"","requests3","p999",2000128
20181020191953.380+00:00,"","requests3","stddev",563876.4091414141
20181020191953.380+00:00,"","requests3","sum",28000512
```

## CSV reporter options

* `writer`
    - The writer used to store the rows.
* `reportInterval`
    - Reporting interval in TimeUnit
    - default value __1000__
* `unit`
    - TimeUnit of the reporting interval
    - default value __MILLISECOND__
* `scheduler`
    - function used to schedule reporting tasks
    - default value __setInterval__
* `clock`
    - Clock used to determine the date for the reporting as well as the minimum-reporting timeout feature
    - default value __new StdClock()__
* `minReportingTimeout`
    - Timeout in minutes a metric need to be included in the report without having changed
    - default value __1__
* `tags`
    - Tags for this reporter instance - to be combined with the tags of each metric while reporting
    - default value __new Map()__
* `useSingleQuotes`
    - Indicates that single quotes are used instead of double quotes.
    - default value __false__
* `tagExportMode`
    - ExportMode for tags
    - default value __ExportMode.ALL_IN_ONE_COLUMN__
* `metadataExportMode`
    - ExportMode for metadata
    - default value __ExportMode.ALL_IN_ONE_COLUMN__
* `tagColumnPrefix`
    - Prefix for tag columns if exported separately
    - default value __`"tag_"`__
* `tagDelimiter`
    - Delimiter between the tags if exported in one column
    - default value __";"__
* `metadataColumnPrefix`
    - Prefix for metadata columns if exported separately
    - default value __`"meta_"`__
* `metadataDelimiter`
    - Delimiter between the metadata if exported in one column
    - default value __";"__
* `columns`
    - The columns to export
    - default value __[]__
    - possible values for each element
        - "date" - the date of the current reporting run
        - "name" - name of the metric
        - "field" - field identifier (depends on the metric type)
        - "group" - group of the metric
        - "description" - description of the metric
        - "value" - numeric value of the field of the metric
        - "tags" - either one column with all tags or all tag columns
        - "type" - type of the metric, one of "counter", "gauge", "histogram", "meter", "timer"
        - "metadata" - either one column with all metadata or all metadata columns
* `dateFormat`
    - The format for the date column
    - default value __"YYYYMMDDHHmmss.SSSZ"__
* `timezone`
    - The timezone used to determine the date
    - default value __"UTC"__
* `tagFilter`
    - An async filter function used to filter out unwanted tags
    - default value __async () => true__
* `metadataFilter`
    - An async filter function used to filter out unwanted metadata
    - default value __async () => true__

## default CSV writer options

* `filename`
    - An async function determining the filename of the metrics
    - default value __async () => ${moment().format("YYYYMMDDHH00")}_metrics.csv__
* `dir`
    - An async function determining the directory of the metricsfile
    - default value __async () => "./metrics"__
* `writeHeaders`
    - Determines if the column headers should be written at the top of each file
    - default value __true__
* `createDir`
    - Determines if the dir for the metrics reporting should be created if it doesn't exist
    - default value __true__
* `delimiter`
    - The delimiter between the fields
    - default value __","__
* `encoding`
    - The encoding of the file
    - default value __"utf8"__
* `lineEnding`
    - The line endings in the file
    - default value __"\n"__

## exporting tags

`example.ts`
```typescript
import {
    CsvMetricReporter,
    DefaultCsvFileWriter,
} from "inspector-csv";
import { MetricRegistry, Timer } from "inspector-metrics";

// metric registry is used in the application code to measure durations, error codes, etc...
const registry: MetricRegistry = new MetricRegistry();

// some timers for this example
const requests1: Timer = registry.newTimer("requests1");
const requests2: Timer = registry.newTimer("requests2");
const requests3: Timer = registry.newTimer("requests3");

requests1.setGroup("requests");
requests2.setGroup("requests");

requests1.setTag("host", "127.0.0.1");
requests2.setTag("host", "127.0.0.2");
// override common tag from reporter
requests2.setTag("type", "override_tag");
requests3.setTag("host", "127.0.0.3");
requests3.setTag("special_tag", "test_abc");

// default csv file writer
const writer = new DefaultCsvFileWriter({});

// configure CSV metric reporter instance
const reporter = new CsvMetricReporter({
    columns: ["date", "group", "name", "field", "value", "type", "tags"],
    tagExportMode: ExportMode.ALL_IN_ONE_COLUMN,
    writer,
});

// common tags for all metrics
const tags = new Map();
tags.set("type", "metric");
reporter.setTags(tags);

// register registry in the reporter
reporter.addMetricRegistry(registry);
// start reporting
reporter.start();

// simulate a running application which produces some custom measures
setInterval(() => requests1.time(() => { ... }), 100);
setInterval(() => requests2.time(() => { ... }), 50);
setInterval(() => requests3.time(() => { ... }), 25);
```

`201810201900_metrics.csv` (example output file)
```csv
date,group,name,field,value,type,tags
20181020194618.877+00:00,"requests","requests1","bucket_0.005",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.01",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.025",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.05",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.1",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.25",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_0.5",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_1",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_2.5",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_5",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_10",1,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","bucket_inf",10,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","count",10,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","m15_rate",9,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","m1_rate",9,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","m5_rate",9,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","max",1999872,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","mean",1000012.8,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","mean_rate",6.565989008975633,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","min",0,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p50",1000064,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p75",1000192,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p95",1999872,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p98",1999872,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p99",1999872,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","p999",1999872,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","stddev",471374.3671220714,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests1","sum",10000128,"timer",type="metric";host="127.0.0.1"
20181020194618.877+00:00,"requests","requests2","bucket_0.005",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.01",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.025",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.05",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.1",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.25",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_0.5",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_1",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_2.5",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_5",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_10",5,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","bucket_inf",20,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","count",20,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","m15_rate",19,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","m1_rate",19,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","m5_rate",19,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","max",3999744,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","mean",900006.4,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","mean_rate",13.106160994487947,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","min",0,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p50",999936,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p75",1000192,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p95",3999744,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p98",3999744,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p99",3999744,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","p999",3999744,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","stddev",852194.9951649873,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"requests","requests2","sum",18000128,"timer",type="override_tag";host="127.0.0.2"
20181020194618.877+00:00,"","requests3","bucket_0.005",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.01",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.025",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.05",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.1",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.25",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_0.5",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_1",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_2.5",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_5",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_10",10,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","bucket_inf",40,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","count",40,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","m15_rate",38,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","m1_rate",38,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","m5_rate",38,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","max",2000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","mean",800006.4,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","mean_rate",26.19515279863145,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","min",0,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p50",999936,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p75",1000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p95",2000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p98",2000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p99",2000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","p999",2000128,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","stddev",516413.0421795807,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
20181020194618.877+00:00,"","requests3","sum",32000256,"timer",type="metric";host="127.0.0.3";special_tag="test_abc"
```

`example-with-separate-colunms.ts`
```typescript
// same as in the example above ...

// configure CSV metric reporter instance
const reporter = new CsvMetricReporter({
    columns: ["date", "group", "name", "field", "value", "type", "tags"],
    tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
    ...
});
```

`201810201900_metrics.csv` (example output file)
```csv
date,group,name,field,value,type,tag_type,tag_host,tag_special_tag
20181020195009.787+00:00,"requests","requests1","bucket_0.005",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.01",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.025",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.05",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.1",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.25",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_0.5",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_1",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_2.5",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_5",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_10",3,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","bucket_inf",10,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","count",10,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","m15_rate",9,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","m1_rate",9,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","m5_rate",9,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","max",3000064,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","mean",999987.2,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","mean_rate",6.578947368421053,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","min",0,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p50",999936,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p75",1250112,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p95",3000064,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p98",3000064,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p99",3000064,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","p999",3000064,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","stddev",942809.0458299838,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests1","sum",9999872,"timer","metric","127.0.0.1",""
20181020195009.787+00:00,"requests","requests2","bucket_0.005",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.01",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.025",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.05",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.1",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.25",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_0.5",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_1",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_2.5",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_5",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_10",3,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","bucket_inf",20,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","count",20,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","m15_rate",19,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","m1_rate",19,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","m5_rate",19,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","max",2000128,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","mean",1049996.8,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","mean_rate",13.1319758106064,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","min",0,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p50",999936,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p75",1749952,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p95",2000128,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p98",2000128,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p99",2000128,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","p999",2000128,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","stddev",604805.6067375874,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"requests","requests2","sum",20999936,"timer","override_tag","127.0.0.2",""
20181020195009.787+00:00,"","requests3","bucket_0.005",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.01",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.025",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.05",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.1",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.25",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_0.5",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_1",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_2.5",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_5",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_10",7,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","bucket_inf",40,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","count",40,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","m15_rate",38,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","m1_rate",38,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","m5_rate",38,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","max",3000064,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","mean",899987.2,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","mean_rate",26.2639516212128,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","min",0,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p50",999936,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p75",999936,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p95",2950067.1999999955,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p98",3000064,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p99",3000064,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","p999",3000064,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","stddev",545386.4756426474,"timer","metric","127.0.0.3","test_abc"
20181020195009.787+00:00,"","requests3","sum",35999488,"timer","metric","127.0.0.3","test_abc"
```

## License

[MIT](https://www.opensource.org/licenses/mit-license.php)
