import 'reflect-metadata'

import { suite, test } from '@testdeck/mocha'

@suite
export class ElasticsearchMetricReporterTest {
  @test
  public checkNothing(): void {}
}
