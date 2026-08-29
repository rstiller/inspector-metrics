import 'reflect-metadata'

import { suite, test } from '@testdeck/mocha'

@suite
export class CarbonMetricReporterTest {
  @test
  public checkNothing(): void {}
}
