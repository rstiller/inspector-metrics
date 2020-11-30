/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'

import {
  InterprocessMessage, MetricRegistry, MetricReporter
} from 'inspector-metrics'
import { suite, test } from '@testdeck/mocha'
import * as moment from 'moment'
import { SinonSpy, spy } from 'sinon'
import { InterprocessReportResponse, PrometheusMetricReporter } from '../../lib/metrics'
import { MockedClock } from './mocked-clock'
import { TestClusterOptions } from './TestClusterOptions'

chai.use(sinonChai)

const expect = chai.expect

@suite
export class PrometheusReporterClusterMasterTest {
  private readonly clock: MockedClock = new MockedClock();
  private registry: MetricRegistry;
  private reporter: PrometheusMetricReporter;
  private clusterOptions: TestClusterOptions;
  private getMetricsStringSpy: SinonSpy;

  public before (): void {
    this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 })
    this.registry = new MetricRegistry()
    this.clusterOptions = new TestClusterOptions(true, false, [], 1000)
    this.reporter = new PrometheusMetricReporter({
      clock: this.clock,
      clusterOptions: this.clusterOptions
    }, 'TestPrometheusMetricReporter')
    this.reporter.addMetricRegistry(this.registry)
    this.getMetricsStringSpy = spy(this.reporter.getMetricsString)
    this.reporter.getMetricsString = this.getMetricsStringSpy
  }

  @test
  public async 'check if ordinary report messages are ignored' (): Promise<void> {
    const message: InterprocessMessage = {
      targetReporterType: 'TestPrometheusMetricReporter',
      type: MetricReporter.MESSAGE_TYPE
    }

    this.verifyMessageIsIgnored(message)
  }

  @test
  public async 'check if wrong targetReporterType is ignored' (): Promise<void> {
    const message: InterprocessMessage = {
      targetReporterType: 'NotMatching',
      type: MetricReporter.MESSAGE_TYPE
    }

    this.verifyMessageIsIgnored(message)
  }

  @test
  public async 'check if unexpected response messages are ignored' (): Promise<void> {
    const message: InterprocessReportResponse = {
      id: 'unexpected',
      metricsStr: '#empty',
      targetReporterType: 'TestPrometheusMetricReporter',
      type: PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE
    }

    this.verifyMessageIsIgnored(message)
  }

  @test
  public async 'check if master process is trying to send messages to workers' (): Promise<void> {
    expect(this.clusterOptions.getWorkersSpy).to.not.have.been.called
    await this.reporter.getMetricsString()
    expect(this.clusterOptions.getWorkersSpy).to.have.been.called
  }

  @test
  public async 'check if timeout for worker responses is working' (): Promise<void> {
    const worker = {}
    this.clusterOptions.workers.push(worker as any)

    expect(this.clusterOptions.getWorkersSpy).to.not.have.been.called
    expect(this.clusterOptions.sendToWorkerSpy).to.not.have.been.called

    const start = moment()
    await this.reporter.getMetricsString()
    const end = moment()

    expect(this.clusterOptions.getWorkersSpy).to.have.been.called
    expect(this.clusterOptions.sendToWorkerSpy).to.have.been.called
    expect(moment.duration(end.diff(start)).as('milliseconds'))
      .to.be.gte(this.clusterOptions.workerResponseTimeout)
  }

  @test
  public async 'check if request message contains all required fields' (): Promise<void> {
    const worker = {}
    this.clusterOptions.workers.push(worker as any)

    expect(this.clusterOptions.getWorkersSpy).to.not.have.been.called
    expect(this.clusterOptions.sendToWorkerSpy).to.not.have.been.called

    await this.reporter.getMetricsString()

    expect(this.clusterOptions.getWorkersSpy).to.have.been.called
    expect(this.clusterOptions.sendToWorkerSpy).to.have.been.called

    const workerArg = this.clusterOptions.sendToWorkerSpy.getCall(0).args[0]
    const messageArg = this.clusterOptions.sendToWorkerSpy.getCall(0).args[1]

    expect(workerArg).to.deep.equal(worker)
    expect(messageArg).to.haveOwnProperty('id')
    expect(messageArg.targetReporterType).to.equal('TestPrometheusMetricReporter')
    expect(messageArg.type).to.equal(PrometheusMetricReporter.MESSAGE_TYPE_REQUEST)
  }

  @test
  public 'check if response from forked process is properly taken into account' (
    done: (err?: any) => any
  ): void {
    const callback = this.clusterOptions.eventReceiverOnSpy.getCall(1).args[1]
    const worker = {}
    this.clusterOptions.workers.push(worker as any)

    expect(this.clusterOptions.getWorkersSpy).to.not.have.been.called
    expect(this.clusterOptions.sendToWorkerSpy).to.not.have.been.called

    const start = moment()
    const metricsPromise = this.reporter.getMetricsString()

    setImmediate(() => {
      expect(this.clusterOptions.getWorkersSpy).to.have.been.called
      expect(this.clusterOptions.sendToWorkerSpy).to.have.been.called

      const requestMessage = this.clusterOptions.sendToWorkerSpy.getCall(0).args[1]
      const responseMessage: InterprocessReportResponse = {
        id: requestMessage.id,
        metricsStr: '#empty',
        targetReporterType: 'TestPrometheusMetricReporter',
        type: PrometheusMetricReporter.MESSAGE_TYPE_RESPONSE
      }
      callback(null /* worker */, responseMessage)

      metricsPromise
        .then((metricsString) => {
          const end = moment()

          expect(metricsString).to.equal('#empty')
          expect(moment.duration(end.diff(start)).as('milliseconds'))
            .to.be.lt(this.clusterOptions.workerResponseTimeout)

          done()
        })
        .catch((cause) => done(cause))
    })
  }

  protected verifyMessageIsIgnored (message: any): void {
    expect(this.getMetricsStringSpy).to.not.have.been.called
    expect(this.clusterOptions.eventReceiverOnSpy).to.have.been.called
    expect(this.clusterOptions.eventReceiverOnSpy.callCount).to.equal(2)

    let messageType = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[0]
    let callback = this.clusterOptions.eventReceiverOnSpy.getCall(0).args[1]

    expect(messageType).to.equal('message')
    expect(callback).to.exist

    callback(null /* worker */, message)

    expect(this.getMetricsStringSpy).to.not.have.been.called

    messageType = this.clusterOptions.eventReceiverOnSpy.getCall(1).args[0]
    callback = this.clusterOptions.eventReceiverOnSpy.getCall(1).args[1]

    expect(messageType).to.equal('message')
    expect(callback).to.exist

    callback(null /* worker */, message)

    expect(this.getMetricsStringSpy).to.not.have.been.called
  }
}
