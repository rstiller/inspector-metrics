/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import { suite, test } from '@testdeck/mocha'

@suite
export class ElasticsearchMetricReporterTest {
  @test
  public checkNothing (): void {
  }
}
