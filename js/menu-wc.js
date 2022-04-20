'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">monorepo documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional documentation</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-metrics.html" data-type="entity-link" data-context-id="additional">inspector-metrics</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-carbon.html" data-type="entity-link" data-context-id="additional">inspector-carbon</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-csv.html" data-type="entity-link" data-context-id="additional">inspector-csv</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-elasticsearch.html" data-type="entity-link" data-context-id="additional">inspector-elasticsearch</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-influx.html" data-type="entity-link" data-context-id="additional">inspector-influx</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-prometheus.html" data-type="entity-link" data-context-id="additional">inspector-prometheus</a>
                                    </li>
                                    <li class="link ">
                                        <a href="additional-documentation/inspector-vm.html" data-type="entity-link" data-context-id="additional">inspector-vm</a>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/BaseMetric.html" data-type="entity-link" >BaseMetric</a>
                            </li>
                            <li class="link">
                                <a href="classes/Buckets.html" data-type="entity-link" >Buckets</a>
                            </li>
                            <li class="link">
                                <a href="classes/CarbonMetricReporter.html" data-type="entity-link" >CarbonMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Clock.html" data-type="entity-link" >Clock</a>
                            </li>
                            <li class="link">
                                <a href="classes/Counter.html" data-type="entity-link" >Counter</a>
                            </li>
                            <li class="link">
                                <a href="classes/CsvMetricReporter.html" data-type="entity-link" >CsvMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultClusterOptions.html" data-type="entity-link" >DefaultClusterOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultCsvFileWriter.html" data-type="entity-link" >DefaultCsvFileWriter</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultPrometheusClusterOptions.html" data-type="entity-link" >DefaultPrometheusClusterOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultReservoir.html" data-type="entity-link" >DefaultReservoir</a>
                            </li>
                            <li class="link">
                                <a href="classes/DisabledClusterOptions.html" data-type="entity-link" >DisabledClusterOptions</a>
                            </li>
                            <li class="link">
                                <a href="classes/ElasticsearchMetricReporter.html" data-type="entity-link" >ElasticsearchMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Event.html" data-type="entity-link" >Event</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExponentiallyWeightedMovingAverage.html" data-type="entity-link" >ExponentiallyWeightedMovingAverage</a>
                            </li>
                            <li class="link">
                                <a href="classes/HdrHistogram.html" data-type="entity-link" >HdrHistogram</a>
                            </li>
                            <li class="link">
                                <a href="classes/HdrSnapshot.html" data-type="entity-link" >HdrSnapshot</a>
                            </li>
                            <li class="link">
                                <a href="classes/Histogram.html" data-type="entity-link" >Histogram</a>
                            </li>
                            <li class="link">
                                <a href="classes/Influxdb1Sender.html" data-type="entity-link" >Influxdb1Sender</a>
                            </li>
                            <li class="link">
                                <a href="classes/Influxdb2Sender.html" data-type="entity-link" >Influxdb2Sender</a>
                            </li>
                            <li class="link">
                                <a href="classes/InfluxMetricReporter.html" data-type="entity-link" >InfluxMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Int64Wrapper.html" data-type="entity-link" >Int64Wrapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoggerReporter.html" data-type="entity-link" >LoggerReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Meter.html" data-type="entity-link" >Meter</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricRegistration.html" data-type="entity-link" >MetricRegistration</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricRegistry.html" data-type="entity-link" >MetricRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricRegistryListenerRegistration.html" data-type="entity-link" >MetricRegistryListenerRegistration</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricReporter.html" data-type="entity-link" >MetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/MonotoneCounter.html" data-type="entity-link" >MonotoneCounter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Percentiles.html" data-type="entity-link" >Percentiles</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrometheusMetricReporter.html" data-type="entity-link" >PrometheusMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/PushgatewayMetricReporter.html" data-type="entity-link" >PushgatewayMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledMetricReporter.html" data-type="entity-link" >ScheduledMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="classes/SimpleGauge.html" data-type="entity-link" >SimpleGauge</a>
                            </li>
                            <li class="link">
                                <a href="classes/SimpleSnapshot.html" data-type="entity-link" >SimpleSnapshot</a>
                            </li>
                            <li class="link">
                                <a href="classes/SizeGauge.html" data-type="entity-link" >SizeGauge</a>
                            </li>
                            <li class="link">
                                <a href="classes/SlidingWindowReservoir.html" data-type="entity-link" >SlidingWindowReservoir</a>
                            </li>
                            <li class="link">
                                <a href="classes/SpaceHistory.html" data-type="entity-link" >SpaceHistory</a>
                            </li>
                            <li class="link">
                                <a href="classes/StdClock.html" data-type="entity-link" >StdClock</a>
                            </li>
                            <li class="link">
                                <a href="classes/StopWatch.html" data-type="entity-link" >StopWatch</a>
                            </li>
                            <li class="link">
                                <a href="classes/TagsOnlyMetricRegistry.html" data-type="entity-link" >TagsOnlyMetricRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/Timer.html" data-type="entity-link" >Timer</a>
                            </li>
                            <li class="link">
                                <a href="classes/TimeUnit.html" data-type="entity-link" >TimeUnit</a>
                            </li>
                            <li class="link">
                                <a href="classes/V8EventLoop.html" data-type="entity-link" >V8EventLoop</a>
                            </li>
                            <li class="link">
                                <a href="classes/V8GCMetrics.html" data-type="entity-link" >V8GCMetrics</a>
                            </li>
                            <li class="link">
                                <a href="classes/V8MemoryMetrics.html" data-type="entity-link" >V8MemoryMetrics</a>
                            </li>
                            <li class="link">
                                <a href="classes/V8ProcessMetrics.html" data-type="entity-link" >V8ProcessMetrics</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/BucketCounting.html" data-type="entity-link" >BucketCounting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BucketToCountMap.html" data-type="entity-link" >BucketToCountMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CarbonData.html" data-type="entity-link" >CarbonData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CarbonMetricReporterOptions.html" data-type="entity-link" >CarbonMetricReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ClusterOptions.html" data-type="entity-link" >ClusterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Counting.html" data-type="entity-link" >Counting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CsvFileWriter.html" data-type="entity-link" >CsvFileWriter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CsvMetricReporterOptions.html" data-type="entity-link" >CsvMetricReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DefaultCsvFileWriterOptions.html" data-type="entity-link" >DefaultCsvFileWriterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElasticsearchMetricReporterOption.html" data-type="entity-link" >ElasticsearchMetricReporterOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Fields.html" data-type="entity-link" >Fields</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Gauge.html" data-type="entity-link" >Gauge</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Groupable.html" data-type="entity-link" >Groupable</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IMetricReporter.html" data-type="entity-link" >IMetricReporter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InfluxMetricReporterOptions.html" data-type="entity-link" >InfluxMetricReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterprocessMessage.html" data-type="entity-link" >InterprocessMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterprocessReportMessage.html" data-type="entity-link" >InterprocessReportMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterprocessReportRequest.html" data-type="entity-link" >InterprocessReportRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterprocessReportResponse.html" data-type="entity-link" >InterprocessReportResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LengthAttributeInterface.html" data-type="entity-link" >LengthAttributeInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LengthMethodInterface.html" data-type="entity-link" >LengthMethodInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Logger.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggerReporterOptions.html" data-type="entity-link" >LoggerReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggerReportingContext.html" data-type="entity-link" >LoggerReportingContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LogLine.html" data-type="entity-link" >LogLine</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MeasurementPoint.html" data-type="entity-link" >MeasurementPoint</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Metadata.html" data-type="entity-link" >Metadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetadataContainer.html" data-type="entity-link" >MetadataContainer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Metered.html" data-type="entity-link" >Metered</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MeteredRates.html" data-type="entity-link" >MeteredRates</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Metric.html" data-type="entity-link" >Metric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricEntry.html" data-type="entity-link" >MetricEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricRegistryListener.html" data-type="entity-link" >MetricRegistryListener</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricReporterOptions.html" data-type="entity-link" >MetricReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricSet.html" data-type="entity-link" >MetricSet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricSetReportContext.html" data-type="entity-link" >MetricSetReportContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MovingAverage.html" data-type="entity-link" >MovingAverage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OverallReportContext.html" data-type="entity-link" >OverallReportContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrometheusClusterOptions.html" data-type="entity-link" >PrometheusClusterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrometheusFields.html" data-type="entity-link" >PrometheusFields</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrometheusMetricResult.html" data-type="entity-link" >PrometheusMetricResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PrometheusReporterOptions.html" data-type="entity-link" >PrometheusReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PushgatewayReporterOptions.html" data-type="entity-link" >PushgatewayReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportingResult.html" data-type="entity-link" >ReportingResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportMessageReceiver.html" data-type="entity-link" >ReportMessageReceiver</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Reservoir.html" data-type="entity-link" >Reservoir</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sampling.html" data-type="entity-link" >Sampling</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScheduledMetricReporterOptions.html" data-type="entity-link" >ScheduledMetricReporterOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sender.html" data-type="entity-link" >Sender</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializableBucketCounting.html" data-type="entity-link" >SerializableBucketCounting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializableMetered.html" data-type="entity-link" >SerializableMetered</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializableMetric.html" data-type="entity-link" >SerializableMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializableSampling.html" data-type="entity-link" >SerializableSampling</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializableSummarizing.html" data-type="entity-link" >SerializableSummarizing</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SerializedSnapshot.html" data-type="entity-link" >SerializedSnapshot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SizeAttributeInterface.html" data-type="entity-link" >SizeAttributeInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SizeMethodInterface.html" data-type="entity-link" >SizeMethodInterface</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Snapshot.html" data-type="entity-link" >Snapshot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Summarizing.html" data-type="entity-link" >Summarizing</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Taggable.html" data-type="entity-link" >Taggable</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Tags.html" data-type="entity-link" >Tags</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Time.html" data-type="entity-link" >Time</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="unit-test.html"><span class="icon ion-ios-podium"></span>Unit test coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});