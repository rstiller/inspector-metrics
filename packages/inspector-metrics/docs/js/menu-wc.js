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
        let tp = lithtml.html(`<nav>
    <ul class="list">
        <li class="title">
            <a href="index.html" data-type="index-link">inspector-metrics documentation</a>
        </li>
        <li class="divider"></li>
        ${ isNormalMode ? `<div id="book-search-input" role="search">
    <input type="text" placeholder="Type to search">
</div>
` : '' }
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
                            <a href="license.html"
                        data-type="chapter-link">
                            <span class="icon ion-ios-paper"></span>LICENSE
                        </a>
                    </li>
                    <li class="link">
                        <a href="dependencies.html"
                            data-type="chapter-link">
                            <span class="icon ion-ios-list"></span>Dependencies
                        </a>
                    </li>
            </ul>
        </li>
        <li class="chapter">
            <div class="simple menu-toggler" data-toggle="collapse"
            ${ isNormalMode ? 'data-target="#classes-links"' : 'data-target="#xs-classes-links"' }>
                <span class="icon ion-ios-paper"></span>
                <span>Classes</span>
                <span class="icon ion-ios-arrow-down"></span>
            </div>
            <ul class="links collapse"
            ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                    <li class="link">
                        <a href="classes/BaseMetric.html" data-type="entity-link">BaseMetric</a>
                    </li>
                    <li class="link">
                        <a href="classes/Buckets.html" data-type="entity-link">Buckets</a>
                    </li>
                    <li class="link">
                        <a href="classes/Clock.html" data-type="entity-link">Clock</a>
                    </li>
                    <li class="link">
                        <a href="classes/Counter.html" data-type="entity-link">Counter</a>
                    </li>
                    <li class="link">
                        <a href="classes/DefaultReservoir.html" data-type="entity-link">DefaultReservoir</a>
                    </li>
                    <li class="link">
                        <a href="classes/ExponentiallyWeightedMovingAverage.html" data-type="entity-link">ExponentiallyWeightedMovingAverage</a>
                    </li>
                    <li class="link">
                        <a href="classes/Histogram.html" data-type="entity-link">Histogram</a>
                    </li>
                    <li class="link">
                        <a href="classes/Int64Wrapper.html" data-type="entity-link">Int64Wrapper</a>
                    </li>
                    <li class="link">
                        <a href="classes/LoggerReporter.html" data-type="entity-link">LoggerReporter</a>
                    </li>
                    <li class="link">
                        <a href="classes/Meter.html" data-type="entity-link">Meter</a>
                    </li>
                    <li class="link">
                        <a href="classes/MetricRegistration.html" data-type="entity-link">MetricRegistration</a>
                    </li>
                    <li class="link">
                        <a href="classes/MetricRegistry.html" data-type="entity-link">MetricRegistry</a>
                    </li>
                    <li class="link">
                        <a href="classes/MetricRegistryListenerRegistration.html" data-type="entity-link">MetricRegistryListenerRegistration</a>
                    </li>
                    <li class="link">
                        <a href="classes/MetricReporter.html" data-type="entity-link">MetricReporter</a>
                    </li>
                    <li class="link">
                        <a href="classes/MonotoneCounter.html" data-type="entity-link">MonotoneCounter</a>
                    </li>
                    <li class="link">
                        <a href="classes/SimpleGauge.html" data-type="entity-link">SimpleGauge</a>
                    </li>
                    <li class="link">
                        <a href="classes/SimpleSnapshot.html" data-type="entity-link">SimpleSnapshot</a>
                    </li>
                    <li class="link">
                        <a href="classes/SizeGauge.html" data-type="entity-link">SizeGauge</a>
                    </li>
                    <li class="link">
                        <a href="classes/SlidingWindowReservoir.html" data-type="entity-link">SlidingWindowReservoir</a>
                    </li>
                    <li class="link">
                        <a href="classes/StdClock.html" data-type="entity-link">StdClock</a>
                    </li>
                    <li class="link">
                        <a href="classes/StopWatch.html" data-type="entity-link">StopWatch</a>
                    </li>
                    <li class="link">
                        <a href="classes/TimeUnit.html" data-type="entity-link">TimeUnit</a>
                    </li>
                    <li class="link">
                        <a href="classes/Timer.html" data-type="entity-link">Timer</a>
                    </li>
            </ul>
        </li>
        <li class="chapter">
            <div class="simple menu-toggler" data-toggle="collapse"
                ${ isNormalMode ? 'data-target="#interfaces-links"' : 'data-target="#xs-interfaces-links"' }>
                <span class="icon ion-md-information-circle-outline"></span>
                <span>Interfaces</span>
                <span class="icon ion-ios-arrow-down"></span>
            </div>
            <ul class="links collapse"
            ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                    <li class="link">
                        <a href="interfaces/BucketCounting.html" data-type="entity-link">BucketCounting</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Counting.html" data-type="entity-link">Counting</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Gauge.html" data-type="entity-link">Gauge</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Groupable.html" data-type="entity-link">Groupable</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/LengthAttributeInterface.html" data-type="entity-link">LengthAttributeInterface</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/LengthMethodInterface.html" data-type="entity-link">LengthMethodInterface</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Logger.html" data-type="entity-link">Logger</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/MetadataContainer.html" data-type="entity-link">MetadataContainer</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Metered.html" data-type="entity-link">Metered</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Metric.html" data-type="entity-link">Metric</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/MetricRegistryListener.html" data-type="entity-link">MetricRegistryListener</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/MetricSet.html" data-type="entity-link">MetricSet</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/MovingAverage.html" data-type="entity-link">MovingAverage</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Reservoir.html" data-type="entity-link">Reservoir</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Sampling.html" data-type="entity-link">Sampling</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/SizeAttributeInterface.html" data-type="entity-link">SizeAttributeInterface</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/SizeMethodInterface.html" data-type="entity-link">SizeMethodInterface</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Snapshot.html" data-type="entity-link">Snapshot</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Summarizing.html" data-type="entity-link">Summarizing</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Taggable.html" data-type="entity-link">Taggable</a>
                    </li>
                    <li class="link">
                        <a href="interfaces/Time.html" data-type="entity-link">Time</a>
                    </li>
            </ul>
        </li>
        <li class="chapter">
            <div class="simple menu-toggler" data-toggle="collapse"
            ${ isNormalMode ? 'data-target="#miscellaneous-links"' : 'data-target="#xs-miscellaneous-links"' }>
                <span class="icon ion-ios-cube"></span>
                <span>Miscellaneous</span>
                <span class="icon ion-ios-arrow-down"></span>
            </div>
            <ul class="links collapse"
            ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
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
                            <img data-src="images/compodoc-vectorise.svg" class="img-responsive" data-type="compodoc-logo">
                </a>
        </li>
    </ul>
</nav>`);
        this.innerHTML = tp.strings;
    }
});
