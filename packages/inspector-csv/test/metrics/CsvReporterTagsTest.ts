/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import { suite, test } from 'mocha-typescript'
import * as sinonChai from 'sinon-chai'
import { ExportMode } from '../../lib/metrics'
import { AbstractReportTest } from './AbstractReporterTest'

chai.use(sinonChai)

const expect = chai.expect

@suite
export class CsvReporterTagsTest extends AbstractReportTest {
  @test
  public async 'check reporting with empty metric registry and tags in columns, but no tags assigned' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tags'])
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check reporting with empty metric registry and tags in one column' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tags'])
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check reporting with tags in one column' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter = this.registry.newCounter('test_counter')
    counter.setTag('type', 'requests_per_second')

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tags'])
    this.verifyWriteCall(
      counter,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter"',
        '"count"',
        '0',
        'app="test-app";version="1.0.0";type="requests_per_second"'
      ]
    )
  }

  @test
  public async 'check reporting with tags in one column and custom delimiter' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagDelimiter: ':',
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter = this.registry.newCounter('test_counter')
    counter.setTag('type', 'requests_per_second')

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tags'])
    this.verifyWriteCall(
      counter,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter"',
        '"count"',
        '0',
        'app="test-app":version="1.0.0":type="requests_per_second"'
      ]
    )
  }

  @test
  public async 'check reporting with empty metric registry and tags in separate columns' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tag_app', 'tag_version'])
    expect(this.writeRowSpy).to.have.not.been.called
  }

  @test
  public async 'check reporting with tags in separate columns' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter = this.registry.newCounter('test_counter')

    await this.triggerReporting()

    this.verifyInitCall(['date', 'group', 'name', 'field', 'value', 'tag_app', 'tag_version'])
    this.verifyWriteCall(
      counter,
      ['19700101000000.000+00:00', '""', '"test_counter"', '"count"', '0', '"test-app"', '"1.0.0"']
    )
  }

  @test
  public async 'check reporting with tags in separate columns as superset of all metrics' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter1 = this.registry.newCounter('test_counter_1')
    counter1.setTag('type', 'requests_per_second')

    const counter2 = this.registry.newCounter('test_counter_2')
    counter2.setTag('measurement', 'iops')

    await this.triggerReporting()

    this.verifyInitCall(
      ['date', 'group', 'name', 'field', 'value', 'tag_app', 'tag_version', 'tag_type', 'tag_measurement']
    )
    this.verifyWriteCall(
      counter1,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_1"',
        '"count"',
        '0',
        '"test-app"',
        '"1.0.0"',
        '"requests_per_second"',
        '""'
      ]
    )
    this.verifyWriteCall(
      counter2,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_2"',
        '"count"',
        '0',
        '"test-app"',
        '"1.0.0"',
        '""',
        '"iops"'
      ],
      1
    )
  }

  @test
  public async 'check reporting with custom tag prefix' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagColumnPrefix: 't_',
      tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter1 = this.registry.newCounter('test_counter_1')
    counter1.setTag('type', 'requests_per_second')

    const counter2 = this.registry.newCounter('test_counter_2')
    counter2.setTag('measurement', 'iops')

    await this.triggerReporting()

    this.verifyInitCall(
      ['date', 'group', 'name', 'field', 'value', 't_app', 't_version', 't_type', 't_measurement']
    )
    this.verifyWriteCall(
      counter1,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_1"',
        '"count"',
        '0',
        '"test-app"',
        '"1.0.0"',
        '"requests_per_second"',
        '""'
      ]
    )
    this.verifyWriteCall(
      counter2,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_2"',
        '"count"',
        '0',
        '"test-app"',
        '"1.0.0"',
        '""',
        '"iops"'
      ],
      1
    )
  }

  @test
  public async 'check tag filtering in columns' (): Promise<void> {
    this.reporter = this.newReporter({
      columns: ['date', 'group', 'name', 'field', 'value', 'tags'],
      tagExportMode: ExportMode.EACH_IN_OWN_COLUMN,
      tagFilter: async (metric, tag, value) => tag !== 'version',
      writer: this.writer
    })
    this.reporter.addMetricRegistry(this.registry)

    const tags = new Map()
    tags.set('app', 'test-app')
    tags.set('version', '1.0.0')
    this.reporter.setTags(tags)

    const counter1 = this.registry.newCounter('test_counter_1')
    counter1.setTag('type', 'requests_per_second')

    const counter2 = this.registry.newCounter('test_counter_2')
    counter2.setTag('measurement', 'iops')

    await this.triggerReporting()

    this.verifyInitCall(
      ['date', 'group', 'name', 'field', 'value', 'tag_app', 'tag_type', 'tag_measurement']
    )
    this.verifyWriteCall(
      counter1,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_1"',
        '"count"',
        '0',
        '"test-app"',
        '"requests_per_second"',
        '""'
      ]
    )
    this.verifyWriteCall(
      counter2,
      [
        '19700101000000.000+00:00',
        '""',
        '"test_counter_2"',
        '"count"',
        '0',
        '"test-app"',
        '""',
        '"iops"'
      ],
      1
    )
  }
}
