/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import { Buckets, Event, NANOSECOND, SimpleGauge } from 'inspector-metrics'
import { suite, test } from 'mocha-typescript'
import * as sinonChai from 'sinon-chai'
import { AbstractReportTest } from './AbstractReporterTest'

chai.use(sinonChai)

const expect = chai.expect

@suite
export class CsvReporterTest extends AbstractReportTest {
  @test
  public async 'check reporting without metric registries and default values' (): Promise<void> {
    this.reporter.removeMetricRegistry(this.registry)

    await this.triggerReporting()

    expect(this.internalCallback).to.not.exist
    expect(this.initSpy).to.have.not.been.called
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check reporting with empty metric registry and default values' (): Promise<void> {
    await this.triggerReporting()

    this.verifyInitCall([])
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check reporting with empty metric registry and some columns' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check encoding of description with double quotes' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'description'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const counter = this.registry.newCounter('test_counter', 'test_group', "desc: '\"abc\"'")

    counter.increment(123)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'description'])
    this.verifyWriteCall(
      counter,
      [
        '19700101000000.000+00:00',
        '"test_group"',
        '"test_counter"',
        '"count"',
        '123',
        "\"desc%3A%20'%22abc%22'\""
      ],
      0
    )
  }

  @test
  public async 'check encoding of description with single quotes' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'description'],
      useSingleQuotes: true,
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const counter = this.registry.newCounter('test_counter', 'test_group', "desc: '\"abc\"'")

    counter.increment(123)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'description'])
    this.verifyWriteCall(
      counter,
      [
        '19700101000000.000+00:00',
        "'test_group'",
        "'test_counter'",
        "'count'",
        '123',
        "'desc%3A%20\\'%22abc%22\\''"
      ],
      0
    )
  }

  @test
  public async 'check fields of counter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const counter1 = this.registry.newCounter('test_counter_1')
    const counter2 = this.registry.newCounter('test_counter_2')

    counter1.increment(123)
    counter2.increment(456)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(
      counter1,
      ['19700101000000.000+00:00', '""', '"test_counter_1"', '"count"', '123'],
      0
    )
    this.verifyWriteCall(
      counter2,
      ['19700101000000.000+00:00', '""', '"test_counter_2"', '"count"', '456'],
      1
    )
  }

  @test
  public async 'check fields of monotone counter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const counter1 = this.registry.newMonotoneCounter('test_counter_1')
    const counter2 = this.registry.newMonotoneCounter('test_counter_2')

    counter1.increment(123)
    counter2.increment(456)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(
      counter1,
      ['19700101000000.000+00:00', '""', '"test_counter_1"', '"count"', '123'],
      0
    )
    this.verifyWriteCall(
      counter2,
      ['19700101000000.000+00:00', '""', '"test_counter_2"', '"count"', '456'],
      1
    )
  }

  @test
  public async 'check fields of gauge' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const gauge1 = new SimpleGauge('test_gauge_1')
    const gauge2 = new SimpleGauge('test_gauge_2')
    this.registry.registerMetric(gauge1)
    this.registry.registerMetric(gauge2)

    gauge1.setValue(123)
    gauge2.setValue(456)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(
      gauge1,
      ['19700101000000.000+00:00', '""', '"test_gauge_1"', '"value"', '123'],
      0
    )
    this.verifyWriteCall(
      gauge2,
      ['19700101000000.000+00:00', '""', '"test_gauge_2"', '"value"', '456'],
      1
    )
  }

  @test
  public async 'check fields of histogram' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const histogram1 = this.registry
      .newHistogram('test_histo_1', 'group123', undefined, '', Buckets.linear(100, 100, 3))
    const histogram2 = this.registry
      .newHistogram('test_histo_2', 'group123', undefined, '', Buckets.linear(125, 25, 4))

    histogram1.update(255)
    histogram1.update(128)

    histogram2.update(128)
    histogram2.update(164)
    histogram2.update(192)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_100"', '0'], 0)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_200"', '1'], 1)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_300"', '2'], 2)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_inf"', '2'], 3)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"count"', '2'], 4)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"max"', '255'], 5)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"mean"', '191.5'], 6)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"min"', '128'], 7)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p50"', '255'], 8)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p75"', '255'], 9)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p95"', '255'], 10)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p98"', '255'], 11)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p99"', '255'], 12)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p999"', '255'], 13)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"stddev"', '89.80256121069154'], 14)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"sum"', '383'], 15)

    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_125"', '0'], 16)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_150"', '1'], 17)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_175"', '2'], 18)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_200"', '3'], 19)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_inf"', '3'], 20)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"count"', '3'], 21)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"max"', '192'], 22)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"mean"', '161.33333333333334'], 23)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"min"', '128'], 24)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p50"', '164'], 25)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p75"', '192'], 26)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p95"', '192'], 27)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p98"', '192'], 28)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p99"', '192'], 29)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p999"', '192'], 30)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"stddev"', '32.083225108042576'], 31)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"sum"', '484'], 32)
  }

  @test
  public async 'check fields of hdr histogram' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const histogram1 = this.registry
      .newHdrHistogram('test_histo_1', 92, 256, 3, 'group123', '', Buckets.linear(100, 100, 3))
    const histogram2 = this.registry
      .newHdrHistogram('test_histo_2', 92, 256, 3, 'group123', '', Buckets.linear(125, 25, 4))

    histogram1.update(255)
    histogram1.update(128)

    histogram2.update(128)
    histogram2.update(164)
    histogram2.update(192)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_100"', '0'], 0)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_200"', '1'], 1)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_300"', '2'], 2)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"bucket_inf"', '2'], 3)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"count"', '2'], 4)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"max"', '255'], 5)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"mean"', '192'], 6)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"min"', '128'], 7)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p50"', '191'], 8)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p75"', '255'], 9)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p95"', '255'], 10)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p98"', '255'], 11)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p99"', '255'], 12)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"p999"', '255'], 13)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"stddev"', '32'], 14)
    this.verifyWriteCall(histogram1,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_1"', '"sum"', '383'], 15)

    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_125"', '0'], 16)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_150"', '1'], 17)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_175"', '2'], 18)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_200"', '3'], 19)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"bucket_inf"', '3'], 20)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"count"', '3'], 21)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"max"', '255'], 22)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"mean"', '181.33333333333334'], 23)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"min"', '128'], 24)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p50"', '191'], 25)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p75"', '191'], 26)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p95"', '255'], 27)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p98"', '255'], 28)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p99"', '255'], 29)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"p999"', '255'], 30)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"stddev"', '30.169889330626027'], 31)
    this.verifyWriteCall(histogram2,
      ['19700101000000.000+00:00', '"group123"', '"test_histo_2"', '"sum"', '484'], 32)
  }

  @test
  public async 'check fields of meter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const meter1 = this.registry
      .newMeter('test_meter_1', 'group123', undefined, undefined, '')
    const meter2 = this.registry
      .newMeter('test_meter_2', 'group123', undefined, undefined, '')

    meter1.mark(1)
    meter1.mark(1)

    meter2.mark(1)
    meter2.mark(1)
    meter2.mark(1)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(meter1,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_1"', '"count"', '2'], 0)
    this.verifyWriteCall(meter1,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_1"', '"m15_rate"', '0'], 1)
    this.verifyWriteCall(meter1,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_1"', '"m1_rate"', '0'], 2)
    this.verifyWriteCall(meter1,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_1"', '"m5_rate"', '0'], 3)
    this.verifyWriteCall(meter1,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_1"', '"mean_rate"', 'Infinity'], 4)

    this.verifyWriteCall(meter2,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_2"', '"count"', '3'], 5)
    this.verifyWriteCall(meter2,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_2"', '"m15_rate"', '0'], 6)
    this.verifyWriteCall(meter2,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_2"', '"m1_rate"', '0'], 7)
    this.verifyWriteCall(meter2,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_2"', '"m5_rate"', '0'], 8)
    this.verifyWriteCall(meter2,
      ['19700101000000.000+00:00', '"group123"', '"test_meter_2"', '"mean_rate"', 'Infinity'], 9)
  }

  @test
  public async 'check fields of timer' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    const timer1 = this.registry
      .newTimer('test_timer_1', 'group123', undefined, undefined, '', Buckets.linear(100, 100, 3))
    const timer2 = this.registry
      .newTimer('test_timer_2', 'group123', undefined, undefined, '', Buckets.linear(125, 25, 4))

    timer1.addDuration(255, NANOSECOND)
    timer1.addDuration(128, NANOSECOND)

    timer2.addDuration(128, NANOSECOND)
    timer2.addDuration(164, NANOSECOND)
    timer2.addDuration(192, NANOSECOND)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"bucket_100"', '0'], 0)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"bucket_200"', '1'], 1)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"bucket_300"', '2'], 2)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"bucket_inf"', '2'], 3)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"count"', '2'], 4)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"m15_rate"', '0'], 5)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"m1_rate"', '0'], 6)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"m5_rate"', '0'], 7)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"max"', '255'], 8)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"mean"', '191.5'], 9)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"mean_rate"', 'Infinity'], 10)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"min"', '128'], 11)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p50"', '255'], 12)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p75"', '255'], 13)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p95"', '255'], 14)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p98"', '255'], 15)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p99"', '255'], 16)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"p999"', '255'], 17)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"stddev"', '89.80256121069154'], 18)
    this.verifyWriteCall(timer1,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_1"', '"sum"', '383'], 19)

    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"bucket_125"', '0'], 20)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"bucket_150"', '1'], 21)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"bucket_175"', '2'], 22)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"bucket_200"', '3'], 23)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"bucket_inf"', '3'], 24)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"count"', '3'], 25)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"m15_rate"', '0'], 26)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"m1_rate"', '0'], 27)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"m5_rate"', '0'], 28)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"max"', '192'], 29)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"mean"', '161.33333333333334'], 30)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"mean_rate"', 'Infinity'], 31)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"min"', '128'], 32)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p50"', '164'], 33)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p75"', '192'], 34)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p95"', '192'], 35)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p98"', '192'], 36)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p99"', '192'], 37)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"p999"', '192'], 38)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"stddev"', '32.083225108042576'], 39)
    this.verifyWriteCall(timer2,
      ['19700101000000.000+00:00', '"group123"', '"test_timer_2"', '"sum"', '484'], 40)
  }

  @test
  public async 'check reporting of event without starting reporter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })

    const event = new Event<number>('application_started')
      .setValue(1.0)
      .setTag('mode', 'test')
      .setTag('customTag', 'specialValue')
      .setTime(new Date(0))

    await this.reporter.reportEvent(event)

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(
      event,
      ['19700101000000.000+00:00', '""', '"application_started"', '"value"', '1'],
      0
    )
  }

  @test
  public async 'check reporting of many events without starting reporter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })

    for (let i = 0; i < 10; i++) {
      const event = new Event<number>('application_started')
        .setValue(i)
        .setTag('mode', 'test')
        .setTag('customTag', 'specialValue')
        .setTime(new Date(i))

      await this.reporter.reportEvent(event)

      this.verifyInitCall(['date', 'group', 'name', 'field', 'value'], i)
      this.verifyWriteCall(
        event,
        [`19700101000000.00${i}+00:00`, '""', '"application_started"', '"value"', `${i}`],
        i
      )
    }
  }

  @test
  public async 'check reporting of event after starting reporter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })

    this.reporter.addMetricRegistry(this.registry)

    await this.triggerReporting()

    const event = new Event<number>('application_started')
      .setValue(1.0)
      .setTag('mode', 'test')
      .setTag('customTag', 'specialValue')
      .setTime(new Date(0))

    await this.reporter.reportEvent(event)

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value'])
    this.verifyWriteCall(
      event,
      ['19700101000000.000+00:00', '""', '"application_started"', '"value"', '1'],
      0
    )
  }

  @test
  public async 'check reporting of many events after starting reporter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value'],
      writer: this.writer
    })

    this.reporter.addMetricRegistry(this.registry)

    await this.triggerReporting()

    for (let i = 0; i < 10; i++) {
      const event = new Event<number>('application_started')
        .setValue(i)
        .setTag('mode', 'test')
        .setTag('customTag', 'specialValue')
        .setTime(new Date(i))

      await this.reporter.reportEvent(event)

      this.verifyInitCall(['date', 'group', 'name', 'field', 'value'], i)
      this.verifyWriteCall(
        event,
        [`19700101000000.00${i}+00:00`, '""', '"application_started"', '"value"', `${i}`],
        i
      )
    }
  }
}
