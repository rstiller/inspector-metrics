/* eslint-env mocha */

import 'source-map-support/register'

import * as chai from 'chai'
import { MetricRegistry, StdClock } from 'inspector-metrics'
import { suite, test } from 'mocha-typescript'
import { V8GCMetrics } from '../../lib/metrics/V8GCMetrics'

const expect = chai.expect

@suite
export class V8GCMetricsTest {
  @test
  public settingGroup (): void {
    const metric: V8GCMetrics = new V8GCMetrics('v8', new StdClock())

    expect(metric.getGroup()).to.not.exist
    metric.getMetrics().forEach((submetric) => {
      expect(submetric.getGroup()).to.not.exist
    })

    metric.setGroup('abc')
    expect(metric.getGroup()).to.equal('abc')
    metric.getMetrics().forEach((submetric) => {
      expect(submetric.getGroup()).to.equal('abc')
    })

    metric.stop()
  }

  @test
  public settingTag (): void {
    const metric: V8GCMetrics = new V8GCMetrics('v8', new StdClock())

    metric.setTag('type', 'value')
    expect(metric.getTag('type')).to.equal('value')
    metric.getMetrics().forEach((submetric) => {
      expect(submetric.getTag('type')).to.equal('value')
    })

    metric.removeTag('type')
    expect(metric.getTag('type')).to.not.exist
    metric.getMetrics().forEach((submetric) => {
      expect(submetric.getTag('type')).to.not.exist
    })

    metric.stop()
  }

  @test
  public checkRegistration (): void {
    const registry = new MetricRegistry()
    const metric: V8GCMetrics = new V8GCMetrics('v8', new StdClock())

    registry.registerMetric(metric)

    expect(registry.getMetrics().size).to.equal(metric.getMetrics().size)
    registry.getMetrics().forEach((submetric) => {
      expect(submetric.getGroup()).to.equal('v8')
    })

    metric.stop()
  }
}
