/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import { Event, ReportingResult } from 'inspector-metrics'
import { suite, test } from 'mocha-typescript'
import { CsvMetricReporter } from '../../lib/metrics'
import { AbstractReportTest } from './AbstractReporterTest'
import { TestClusterOptions } from './TestClusterOptions'

chai.use(sinonChai)

const expect = chai.expect

@suite
export class CsvReporterClusterWorkerTest extends AbstractReportTest {
  private clusterOptions: TestClusterOptions;

  public before (): void {
    super.before()
    this.clusterOptions = new TestClusterOptions(true, true, [])
    this.reporter = this.newReporter({
      clusterOptions: this.clusterOptions,
      columns: ['date', 'group', 'name', 'field', 'value', 'description'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
  }

  @test
  public async 'check if metrics are serialized and send to master' (): Promise<void> {
    this.registry.newCounter('counter1')

    expect(this.clusterOptions.sendToMasterSpy).to.have.not.been.called

    await this.triggerReporting()

    expect(this.clusterOptions.sendToMasterSpy).to.have.been.called

    let interprocessReportMessage = this.clusterOptions.sendToMasterSpy.getCall(0).args[0]
    // simulating the serialization
    interprocessReportMessage = JSON.parse(JSON.stringify(interprocessReportMessage))

    expect(interprocessReportMessage).to.have.property('ctx')
    expect(interprocessReportMessage).to.have.property('date')
    expect(interprocessReportMessage).to.have.property('metrics')
    expect(interprocessReportMessage).to.have.property('tags')
    expect(interprocessReportMessage).to.have.property('targetReporterType')
    expect(interprocessReportMessage).to.have.property('type')

    expect(interprocessReportMessage.type).to.equal(CsvMetricReporter.MESSAGE_TYPE)
    expect(interprocessReportMessage.targetReporterType).to.equal('TestMetricReporter')

    const metrics = interprocessReportMessage.metrics
    expect(metrics).to.have.property('counters')
    expect(metrics).to.have.property('gauges')
    expect(metrics).to.have.property('histograms')
    expect(metrics).to.have.property('meters')
    expect(metrics).to.have.property('monotoneCounters')
    expect(metrics).to.have.property('timers')

    const counters = metrics.counters
    expect(counters).to.have.length(1)

    const result: ReportingResult<any, any> = counters[0]
    expect(result.metric.name).to.equal('counter1')
    expect(result.metric.count).to.equal(0)
    expect(result.result.count).to.equal('0')
  }

  @test
  public async 'check if events are serialized and send to master' (): Promise<void> {
    const event = new Event('test-event')
      .setTime(new Date(this.clock.time().milliseconds))
      .setValue(123)
    await this.reporter.reportEvent(event)

    expect(this.clusterOptions.sendToMasterSpy).to.have.been.called

    let interprocessReportMessage = this.clusterOptions.sendToMasterSpy.getCall(0).args[0]
    // simulating the serialization
    interprocessReportMessage = JSON.parse(JSON.stringify(interprocessReportMessage))

    expect(interprocessReportMessage).to.have.property('ctx')
    expect(interprocessReportMessage).to.have.property('date')
    expect(interprocessReportMessage).to.have.property('metrics')
    expect(interprocessReportMessage).to.have.property('tags')
    expect(interprocessReportMessage).to.have.property('targetReporterType')
    expect(interprocessReportMessage).to.have.property('type')

    expect(interprocessReportMessage.type).to.equal(CsvMetricReporter.MESSAGE_TYPE)
    expect(interprocessReportMessage.targetReporterType).to.equal('TestMetricReporter')

    const metrics = interprocessReportMessage.metrics
    expect(metrics).to.have.property('counters')
    expect(metrics).to.have.property('gauges')
    expect(metrics).to.have.property('histograms')
    expect(metrics).to.have.property('meters')
    expect(metrics).to.have.property('monotoneCounters')
    expect(metrics).to.have.property('timers')

    const gauges = metrics.gauges
    expect(gauges).to.have.length(1)

    const result: ReportingResult<any, any> = gauges[0]
    expect(result.metric.name).to.equal('test-event')
    expect(result.metric.value).to.equal(123)
    expect(result.result.value).to.equal('123')
  }

  @test
  public async 'check if writer.init is not called' (): Promise<void> {
    expect(this.initSpy).to.have.not.been.called

    await this.triggerReporting()

    expect(this.initSpy).to.have.not.been.called
  }
}
