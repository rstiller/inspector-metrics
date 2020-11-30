/* eslint-env mocha */

import 'reflect-metadata'
import 'source-map-support/register'

import * as chai from 'chai'
import { suite, test } from '@testdeck/mocha'

import { Buckets } from '../../lib/metrics'
import { SlidingWindowReservoir } from '../../lib/metrics/model/reservoir'
import { Snapshot } from '../../lib/metrics/model/snapshot'
import { MICROSECOND, NANOSECOND } from '../../lib/metrics/model/time-unit'
import { StopWatch, Timer } from '../../lib/metrics/timer'
import { MockedClock } from './mocked-clock'

const expect = chai.expect

@suite
export class TimerTest {
  private readonly clock: MockedClock = new MockedClock()

  @test
  public 'check name and description' (): void {
    let timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))
    expect(timer.getName()).to.be.undefined
    expect(timer.getDescription()).to.be.undefined

    timer = new Timer(this.clock, new SlidingWindowReservoir(3), 'timer-name')
    expect(timer.getName()).to.equal('timer-name')
    expect(timer.getDescription()).to.be.undefined

    timer = new Timer(this.clock, new SlidingWindowReservoir(3), 'timer-name', 'timer-description')
    expect(timer.getName()).to.equal('timer-name')
    expect(timer.getDescription()).to.equal('timer-description')
  }

  @test
  public 'negative duration' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    timer.addDuration(-1, NANOSECOND)

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)
  }

  @test
  public 'single duration measuring with no tick' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    timer.addDuration(10, MICROSECOND)

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(10000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(Infinity)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000)
    expect(snapshot.get95thPercentile()).to.equal(10000)
    expect(snapshot.get98thPercentile()).to.equal(10000)
    expect(snapshot.get99thPercentile()).to.equal(10000)
    expect(snapshot.get999thPercentile()).to.equal(10000)
    expect(snapshot.getMax()).to.equal(10000)
    expect(snapshot.getMean()).to.equal(10000)
    expect(snapshot.getMedian()).to.equal(10000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.be.NaN
  }

  @test
  public 'multiple duration measuring with no tick' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(3)
    expect(timer.getSum().toNumber()).to.equal(60000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(Infinity)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)
  }

  @test
  public 'single duration measuring with one tick' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(10000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.lessThan(1)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000)
    expect(snapshot.get95thPercentile()).to.equal(10000)
    expect(snapshot.get98thPercentile()).to.equal(10000)
    expect(snapshot.get99thPercentile()).to.equal(10000)
    expect(snapshot.get999thPercentile()).to.equal(10000)
    expect(snapshot.getMax()).to.equal(10000)
    expect(snapshot.getMean()).to.equal(10000)
    expect(snapshot.getMedian()).to.equal(10000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.be.NaN
  }

  @test
  public 'multiple duration measuring with one tick' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(3)
    expect(timer.getSum().toNumber()).to.equal(60000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.lessThan(3)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)
  }

  @test
  public 'multiple duration measuring with multiple ticks' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(3)
    expect(timer.getSum().toNumber()).to.equal(60000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.lessThan(3)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)

    this.clock.setCurrentTime({
      milliseconds: 2001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(6)
    expect(timer.getSum().toNumber()).to.equal(120000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.lessThan(3)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)
  }

  @test
  public 'multiple duration measuring with multiple ticks within different rate-intervals' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(3)
    expect(timer.getSum().toNumber()).to.equal(60000)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.lessThan(3)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)

    this.clock.setCurrentTime({
      milliseconds: 5001,
      nanoseconds: 0
    })
    timer.addDuration(10, MICROSECOND)
    timer.addDuration(20, MICROSECOND)
    timer.addDuration(30, MICROSECOND)

    expect(timer.getCount()).to.equal(6)
    expect(timer.getSum().toNumber()).to.equal(120000)
    expect(timer.get15MinuteRate()).to.greaterThan(0)
    expect(timer.get5MinuteRate()).to.greaterThan(0)
    expect(timer.get1MinuteRate()).to.greaterThan(0)
    expect(timer.getMeanRate()).to.lessThan(3)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(30000)
    expect(snapshot.get95thPercentile()).to.equal(30000)
    expect(snapshot.get98thPercentile()).to.equal(30000)
    expect(snapshot.get99thPercentile()).to.equal(30000)
    expect(snapshot.get999thPercentile()).to.equal(30000)
    expect(snapshot.getMax()).to.equal(30000)
    expect(snapshot.getMean()).to.equal(20000)
    expect(snapshot.getMedian()).to.equal(20000)
    expect(snapshot.getMin()).to.equal(10000)
    expect(snapshot.getStdDev()).to.equal(10000)
  }

  @test
  public 'add duration with time function' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    timer.time(() => {
      this.clock.setCurrentTime({
        milliseconds: 10,
        nanoseconds: 0
      })
    })
    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(10000000)
    expect(timer.get15MinuteRate()).to.greaterThan(0)
    expect(timer.get5MinuteRate()).to.greaterThan(0)
    expect(timer.get1MinuteRate()).to.greaterThan(0)
    expect(timer.getMeanRate()).to.lessThan(1)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000000)
    expect(snapshot.get95thPercentile()).to.equal(10000000)
    expect(snapshot.get98thPercentile()).to.equal(10000000)
    expect(snapshot.get99thPercentile()).to.equal(10000000)
    expect(snapshot.get999thPercentile()).to.equal(10000000)
    expect(snapshot.getMax()).to.equal(10000000)
    expect(snapshot.getMean()).to.equal(10000000)
    expect(snapshot.getMedian()).to.equal(10000000)
    expect(snapshot.getMin()).to.equal(10000000)
    expect(snapshot.getStdDev()).to.be.NaN
  }

  @test
  public 'add duration with async time function' (callback: () => any): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    timer.timeAsync(async () => {
      return await new Promise<void>((resolve) => {
        this.clock.setCurrentTime({
          milliseconds: 10,
          nanoseconds: 0
        })
        resolve()
      })
    })
      .then(() => {
        this.clock.setCurrentTime({
          milliseconds: 1001,
          nanoseconds: 0
        })

        expect(timer.getCount()).to.equal(1)
        expect(timer.getSum().toNumber()).to.equal(10000000)
        expect(timer.get15MinuteRate()).to.greaterThan(0)
        expect(timer.get5MinuteRate()).to.greaterThan(0)
        expect(timer.get1MinuteRate()).to.greaterThan(0)
        expect(timer.getMeanRate()).to.lessThan(1)

        snapshot = timer.getSnapshot()
        expect(snapshot.get75thPercentile()).to.equal(10000000)
        expect(snapshot.get95thPercentile()).to.equal(10000000)
        expect(snapshot.get98thPercentile()).to.equal(10000000)
        expect(snapshot.get99thPercentile()).to.equal(10000000)
        expect(snapshot.get999thPercentile()).to.equal(10000000)
        expect(snapshot.getMax()).to.equal(10000000)
        expect(snapshot.getMean()).to.equal(10000000)
        expect(snapshot.getMedian()).to.equal(10000000)
        expect(snapshot.getMin()).to.equal(10000000)
        expect(snapshot.getStdDev()).to.be.NaN
      })
      .then(callback)
      .catch(callback)
  }

  @test
  public 'check bucket counting' (): void {
    const buckets = Buckets.linear(100, 200, 5)
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3), 'name', 'description', buckets)

    expect(timer.getBuckets()).to.be.equal(buckets)
    expect(timer.getBuckets().boundaries).to.deep.equal([
      100, 300, 500, 700, 900
    ])
    expect(timer.getCounts()).to.satisfy((map: Map<number, number>) => map.size === 5)

    timer.addDuration(101, NANOSECOND)

    expect(timer.getCount()).to.be.equal(1)
    expect(timer.getCounts().get(100)).to.be.equal(0)
    expect(timer.getCounts().get(300)).to.be.equal(1)
    expect(timer.getCounts().get(500)).to.be.equal(1)
    expect(timer.getCounts().get(700)).to.be.equal(1)
    expect(timer.getCounts().get(900)).to.be.equal(1)

    timer.addDuration(1001, NANOSECOND)

    expect(timer.getCount()).to.be.equal(2)
    expect(timer.getCounts().get(100)).to.be.equal(0)
    expect(timer.getCounts().get(300)).to.be.equal(1)
    expect(timer.getCounts().get(500)).to.be.equal(1)
    expect(timer.getCounts().get(700)).to.be.equal(1)
    expect(timer.getCounts().get(900)).to.be.equal(1)

    timer.addDuration(50, NANOSECOND)

    expect(timer.getCount()).to.be.equal(3)
    expect(timer.getCounts().get(100)).to.be.equal(1)
    expect(timer.getCounts().get(300)).to.be.equal(2)
    expect(timer.getCounts().get(500)).to.be.equal(2)
    expect(timer.getCounts().get(700)).to.be.equal(2)
    expect(timer.getCounts().get(900)).to.be.equal(2)
  }

  @test
  public 'check bucket counting more than reservoir capacity' (): void {
    const buckets = Buckets.linear(100, 200, 5)
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3), 'name', 'description', buckets)

    expect(timer.getBuckets()).to.be.equal(buckets)
    expect(timer.getBuckets().boundaries).to.deep.equal([
      100, 300, 500, 700, 900
    ])
    expect(timer.getCounts()).to.satisfy((map: Map<number, number>) => map.size === 5)

    timer.addDuration(50, NANOSECOND)
    timer.addDuration(100, NANOSECOND)
    timer.addDuration(150, NANOSECOND)
    timer.addDuration(200, NANOSECOND)
    timer.addDuration(250, NANOSECOND)
    timer.addDuration(300, NANOSECOND)
    timer.addDuration(350, NANOSECOND)
    timer.addDuration(400, NANOSECOND)
    timer.addDuration(450, NANOSECOND)
    timer.addDuration(500, NANOSECOND)

    expect(timer.getCount()).to.be.equal(10)
    expect(timer.getCounts().get(100)).to.be.equal(1)
    expect(timer.getCounts().get(300)).to.be.equal(5)
    expect(timer.getCounts().get(500)).to.be.equal(9)
    expect(timer.getCounts().get(700)).to.be.equal(10)
    expect(timer.getCounts().get(900)).to.be.equal(10)
  }

  @test
  public 'check serialization' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const internalObject = {
      property1: 'value1',
      property2: 2
    }
    const buckets = Buckets.linear(100, 200, 5)
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3), 'name', 'description', buckets)
      .setTag('key1', 'value1')
      .setTag('key2', 'value2')
      .setMetadata('internalObject', internalObject)

    timer.addDuration(50, NANOSECOND)
    timer.addDuration(100, NANOSECOND)
    timer.addDuration(150, NANOSECOND)
    timer.addDuration(200, NANOSECOND)

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })

    timer.addDuration(250, NANOSECOND)
    timer.addDuration(300, NANOSECOND)
    timer.addDuration(350, NANOSECOND)

    this.clock.setCurrentTime({
      milliseconds: 2001,
      nanoseconds: 0
    })

    timer.addDuration(400, NANOSECOND)
    timer.addDuration(450, NANOSECOND)
    timer.addDuration(500, NANOSECOND)

    const serializedTimer = JSON.parse(JSON.stringify(timer))
    expect(Object.keys(serializedTimer).length).to.equal(11)

    expect(serializedTimer).has.property('name')
    expect(serializedTimer.name).to.equal('name')

    expect(serializedTimer).has.property('description')
    expect(serializedTimer.description).to.equal('description')

    expect(serializedTimer).has.property('tags')
    expect(Object.keys(serializedTimer.tags).length).to.equal(2)
    expect(serializedTimer.tags.key1).to.equal('value1')
    expect(serializedTimer.tags.key2).to.equal('value2')

    expect(serializedTimer).has.property('metadata')
    expect(Object.keys(serializedTimer.metadata).length).to.equal(1)
    expect(serializedTimer.metadata.internalObject).to.deep.equal(internalObject)

    expect(serializedTimer).has.property('count')
    expect(serializedTimer.count).to.equal(10)

    expect(serializedTimer).has.property('sum')
    expect(serializedTimer.sum).to.equal('2750')

    expect(serializedTimer).has.property('buckets')
    expect(serializedTimer.buckets).to.deep.equal(buckets.boundaries)

    expect(serializedTimer).has.property('counts')
    expect(serializedTimer.counts).to.deep.equal({
      100: 1,
      300: 5,
      500: 9,
      700: 10,
      900: 10
    })

    expect(serializedTimer).has.property('snapshot')
    expect(serializedTimer.snapshot.values).to.deep.equal([400, 450, 500])

    expect(serializedTimer).has.property('meanRate')
    expect(serializedTimer.meanRate).to.be.closeTo(4.99, 0.01)

    expect(serializedTimer).has.property('rates')
    expect(serializedTimer.rates[1]).to.be.closeTo(4, 0.1)
    expect(serializedTimer.rates[5]).to.be.closeTo(4, 0.1)
    expect(serializedTimer.rates[15]).to.be.closeTo(4, 0.1)
  }
}

@suite
export class StopWatchTest {
  private readonly clock: MockedClock = new MockedClock()

  @test
  public 'start and stop without time difference' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))
    const stopWatch: StopWatch = timer.newStopWatch()

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    stopWatch.start()
    stopWatch.stop()

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(Infinity)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.equal(0)
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.equal(0)
    expect(snapshot.getStdDev()).to.be.NaN
  }

  @test
  public 'start and stop with time difference' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))
    const stopWatch: StopWatch = timer.newStopWatch()

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    stopWatch.start()

    this.clock.setCurrentTime({
      milliseconds: 10,
      nanoseconds: 0
    })

    stopWatch.stop()

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(10000000)
    expect(timer.get15MinuteRate()).to.greaterThan(0)
    expect(timer.get5MinuteRate()).to.greaterThan(0)
    expect(timer.get1MinuteRate()).to.greaterThan(0)
    expect(timer.getMeanRate()).to.lessThan(1)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000000)
    expect(snapshot.get95thPercentile()).to.equal(10000000)
    expect(snapshot.get98thPercentile()).to.equal(10000000)
    expect(snapshot.get99thPercentile()).to.equal(10000000)
    expect(snapshot.get999thPercentile()).to.equal(10000000)
    expect(snapshot.getMax()).to.equal(10000000)
    expect(snapshot.getMean()).to.equal(10000000)
    expect(snapshot.getMedian()).to.equal(10000000)
    expect(snapshot.getMin()).to.equal(10000000)
    expect(snapshot.getStdDev()).to.be.NaN
  }

  @test
  public 'start and stop with time difference within different rate-intervals' (): void {
    this.clock.setCurrentTime({
      milliseconds: 0,
      nanoseconds: 0
    })
    const timer: Timer = new Timer(this.clock, new SlidingWindowReservoir(3))
    const stopWatch: StopWatch = timer.newStopWatch()

    expect(timer.getCount()).to.equal(0)
    expect(timer.getSum().toNumber()).to.equal(0)
    expect(timer.get15MinuteRate()).to.equal(0)
    expect(timer.get5MinuteRate()).to.equal(0)
    expect(timer.get1MinuteRate()).to.equal(0)
    expect(timer.getMeanRate()).to.equal(0)

    let snapshot: Snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(0)
    expect(snapshot.get95thPercentile()).to.equal(0)
    expect(snapshot.get98thPercentile()).to.equal(0)
    expect(snapshot.get99thPercentile()).to.equal(0)
    expect(snapshot.get999thPercentile()).to.equal(0)
    expect(snapshot.getMax()).to.be.undefined
    expect(snapshot.getMean()).to.equal(0)
    expect(snapshot.getMedian()).to.equal(0)
    expect(snapshot.getMin()).to.be.undefined
    expect(snapshot.getStdDev()).to.equal(0)

    stopWatch.start()

    this.clock.setCurrentTime({
      milliseconds: 10,
      nanoseconds: 0
    })

    stopWatch.stop()

    this.clock.setCurrentTime({
      milliseconds: 1001,
      nanoseconds: 0
    })

    expect(timer.getCount()).to.equal(1)
    expect(timer.getSum().toNumber()).to.equal(10000000)
    expect(timer.get15MinuteRate()).to.greaterThan(0)
    expect(timer.get5MinuteRate()).to.greaterThan(0)
    expect(timer.get1MinuteRate()).to.greaterThan(0)
    expect(timer.getMeanRate()).to.lessThan(1)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000000)
    expect(snapshot.get95thPercentile()).to.equal(10000000)
    expect(snapshot.get98thPercentile()).to.equal(10000000)
    expect(snapshot.get99thPercentile()).to.equal(10000000)
    expect(snapshot.get999thPercentile()).to.equal(10000000)
    expect(snapshot.getMax()).to.equal(10000000)
    expect(snapshot.getMean()).to.equal(10000000)
    expect(snapshot.getMedian()).to.equal(10000000)
    expect(snapshot.getMin()).to.equal(10000000)
    expect(snapshot.getStdDev()).to.be.NaN

    stopWatch.start()

    this.clock.setCurrentTime({
      milliseconds: 1011,
      nanoseconds: 0
    })

    stopWatch.stop()

    this.clock.setCurrentTime({
      milliseconds: 5001,
      nanoseconds: 0
    })

    expect(timer.getCount()).to.equal(2)
    expect(timer.getSum().toNumber()).to.equal(20000000)
    expect(timer.get15MinuteRate()).to.greaterThan(0)
    expect(timer.get5MinuteRate()).to.greaterThan(0)
    expect(timer.get1MinuteRate()).to.greaterThan(0)
    expect(timer.getMeanRate()).to.lessThan(1)

    snapshot = timer.getSnapshot()
    expect(snapshot.get75thPercentile()).to.equal(10000000)
    expect(snapshot.get95thPercentile()).to.equal(10000000)
    expect(snapshot.get98thPercentile()).to.equal(10000000)
    expect(snapshot.get99thPercentile()).to.equal(10000000)
    expect(snapshot.get999thPercentile()).to.equal(10000000)
    expect(snapshot.getMax()).to.equal(10000000)
    expect(snapshot.getMean()).to.equal(10000000)
    expect(snapshot.getMedian()).to.equal(10000000)
    expect(snapshot.getMin()).to.equal(10000000)
    expect(snapshot.getStdDev()).to.equal(0)
  }
}
