/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import { suite, test } from 'mocha-typescript'

@suite
export class CarbonMetricReporterTest {
  @test
  public checkNothing (): void {
  }
}
