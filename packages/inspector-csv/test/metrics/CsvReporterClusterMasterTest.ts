/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import {
  Counter,
  InterprocessMessage,
  InterprocessReportMessage,
  MetricReporter
} from 'inspector-metrics'
import { suite, test } from '@testdeck/mocha'
import { SinonSpy, spy } from 'sinon'
import { AbstractReportTest } from './AbstractReporterTest'
import { TestClusterOptions } from './TestClusterOptions'

chai.use(sinonChai)

const expect = chai.expect

@suite
export class CsvReporterClusterMasterTest extends AbstractReportTest {
  private clusterOptions: TestClusterOptions;
  private handleResultSpy: SinonSpy;

  public before (): void {
    super.before()
    this.clusterOptions = new TestClusterOptions(true, false, [])
    this.reporter = this.newReporter({
      clusterOptions: this.clusterOptions,
      columns: ['date', 'group', 'name', 'field', 'value', 'description'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)
    this.handleResultSpy = spy((this.reporter as any).handleResults);
    (this.reporter as any).handleResults = this.handleResultSpy
  }

  @test
  public async 'check if wrong targetReporterType is ignored' (): Promise<void> {
    const message: InterprocessMessage = {
      targetReporterType: 'NotMatching',
      type: MetricReporter.MESSAGE_TYPE
    }

    expect(this.handleResultSpy).to.not.have.been.called

    await this.callWithMessage(message)

    expect(this.handleResultSpy).to.not.have.been.called
  }

  @test
  public async 'check if report message is processed even if reporter is not started' (): Promise<void> {
    const counter = new Counter('counter1')
      .setMetadata('hostname', 'server1')
    const serializedCounter = JSON.parse(JSON.stringify(counter))
    const date = new Date(this.clock.time().milliseconds)
    const message: InterprocessReportMessage<any> = {
      ctx: {},
      date,
      metrics: {
        counters: [{
          metric: serializedCounter,
          result: {
            count: '0',
            metadata: {
              hostname: 'server1'
            }
          }
        }],
        gauges: [],
        histograms: [],
        meters: [],
        monotoneCounters: [],
        timers: []
      },
      tags: null,
      targetReporterType: 'TestMetricReporter',
      type: MetricReporter.MESSAGE_TYPE
    }

    expect(this.handleResultSpy).to.not.have.been.called

    await this.callWithMessage(message)

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'description'])
    this.verifyWriteCall(
      serializedCounter,
      [
        '19700101000000.000+00:00',
        '""',
        '"counter1"',
        '"count"',
        '0',
        '""'
      ],
      0
    )
  }

  @test
  public async 'check if report message is processed if reporter is started' (): Promise<void> {
    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'description'])

    const counter = new Counter('counter1')
      .setMetadata('hostname', 'server1')
    const serializedCounter = JSON.parse(JSON.stringify(counter))
    const date = new Date(this.clock.time().milliseconds)
    const message: InterprocessReportMessage<any> = {
      ctx: {},
      date,
      metrics: {
        counters: [{
          metric: serializedCounter,
          result: {
            count: '0',
            metadata: {
              hostname: 'server1'
            }
          }
        }],
        gauges: [],
        histograms: [],
        meters: [],
        monotoneCounters: [],
        timers: []
      },
      tags: null,
      targetReporterType: 'TestMetricReporter',
      type: MetricReporter.MESSAGE_TYPE
    }

    await this.callWithMessage(message)

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'description'], 1)
    this.verifyWriteCall(
      serializedCounter,
      [
        '19700101000000.000+00:00',
        '""',
        '"counter1"',
        '"count"',
        '0',
        '""'
      ],
      0
    )
  }

  protected async callWithMessage (message: any): Promise<void> {
    expect(this.clusterOptions.eventReceiverOnSpy).to.have.been.called
    expect(this.clusterOptions.eventReceiverOnSpy.callCount).to.equal(1)

    const messageType = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[0]
    const callback = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[1]

    expect(messageType).to.equal('message')
    expect(callback).to.exist

    await callback(null /* worker */, message)
  }
}
