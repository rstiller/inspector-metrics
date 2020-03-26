/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import {
  Metric, MetricRegistry, MILLISECOND
} from 'inspector-metrics'
import { SinonSpy, spy } from 'sinon'
import * as sinonChai from 'sinon-chai'
import {
  CsvFileWriter,
  CsvMetricReporter,
  CsvMetricReporterOptions,
  ExportMode,
  Row
} from '../../lib/metrics'
import { MockedClock } from './mocked-clock'
import { TestClusterOptions } from './TestClusterOptions'

chai.use(sinonChai)

const expect = chai.expect

export class AbstractReportTest {
  protected internalCallback: () => Promise<any>;
  protected clock: MockedClock = new MockedClock();
  protected registry: MetricRegistry;
  protected reporter: CsvMetricReporter;
  protected initSpy: SinonSpy;
  protected writeRowSpy: SinonSpy;
  protected writer: CsvFileWriter;

  public before (): void {
    this.clock.setCurrentTime({ milliseconds: 0, nanoseconds: 0 })
    this.registry = new MetricRegistry()
    this.registry.setDefaultClock(this.clock)
    this.initSpy = spy()
    this.writeRowSpy = spy()
    this.writer = {
      init: this.initSpy,
      writeRow: this.writeRowSpy
    }
    this.reporter = this.newReporter({})
    this.reporter.addMetricRegistry(this.registry)
  }

  protected newReporter ({
    writer = this.writer,
    useSingleQuotes = false,
    tagExportMode = ExportMode.ALL_IN_ONE_COLUMN,
    metadataExportMode = ExportMode.ALL_IN_ONE_COLUMN,
    tagColumnPrefix = 'tag_',
    tagDelimiter = ';',
    metadataColumnPrefix = 'meta_',
    metadataDelimiter = ';',
    columns = [],
    dateFormat = 'YYYYMMDDHHmmss.SSSZ',
    timezone = 'UTC',
    tagFilter = async () => true,
    metadataFilter = async () => true,
    reportInterval = 1000,
    unit = MILLISECOND,
    clock = this.clock,
    scheduler = (task, interval) => {
      this.internalCallback = task
      return null
    },
    minReportingTimeout = 1,
    tags = new Map(),
    clusterOptions = new TestClusterOptions(false, false, [])
  }: CsvMetricReporterOptions): CsvMetricReporter {
    return new CsvMetricReporter({
      clock,
      clusterOptions,
      columns,
      dateFormat,
      metadataColumnPrefix,
      metadataDelimiter,
      metadataExportMode,
      metadataFilter,
      minReportingTimeout,
      reportInterval,
      scheduler,
      tagColumnPrefix,
      tagDelimiter,
      tagExportMode,
      tagFilter,
      tags,
      timezone,
      unit,
      useSingleQuotes,
      writer
    }, 'TestMetricReporter')
  }

  protected async triggerReporting (): Promise<void> {
    expect(this.initSpy).to.have.not.been.called
    expect(this.writeRowSpy).to.have.not.been.called
    expect(this.internalCallback).to.not.exist

    await this.reporter.start()

    if (this.internalCallback) {
      await this.internalCallback()
    }
  }

  protected verifyInitCall (columns: string[], call = 0): void {
    expect(this.initSpy).to.have.been.called
    const calls = this.initSpy.getCalls()
    expect(calls.length).to.be.gte(call + 1)
    expect(calls[call].args[0]).to.deep.equal(columns)
  }

  protected verifyWriteCall<T extends Metric>(metric: T, row: Row, call = 0): void {
    expect(this.initSpy).to.have.been.called
    const calls = this.writeRowSpy.getCalls()
    expect(calls.length).to.be.gte(call + 1)
    expect(calls[call].args[0]).to.be.equal(metric)
    expect(calls[call].args[1]).to.deep.equal(row)
  }
}
