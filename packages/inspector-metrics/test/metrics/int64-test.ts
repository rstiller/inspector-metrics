import 'reflect-metadata'

import * as chai from 'chai'
import { suite, test } from '@testdeck/mocha'

import { Int64Wrapper } from '../../lib/metrics/model/int64'

const expect = chai.expect

@suite
export class Int64WrapperTest {
  @test
  public 'default constructor'(): void {
    const wrapped = new Int64Wrapper()
    expect(wrapped.toNumber()).to.equal(0)
    // a zero value serializes to an empty string, mirroring node-cint64
    expect(wrapped.toString()).to.equal('')
  }

  @test
  public 'construct from integer'(): void {
    const wrapped = new Int64Wrapper(42)
    expect(wrapped.toNumber()).to.equal(42)
    expect(wrapped.toString()).to.equal('42')
  }

  @test
  public 'construct from negative integer'(): void {
    const wrapped = new Int64Wrapper(-11)
    expect(wrapped.toNumber()).to.equal(-11)
    expect(wrapped.toString()).to.equal('-11')
  }

  @test
  public 'construct truncates fractional value toward zero'(): void {
    expect(new Int64Wrapper(42.7).toString()).to.equal('42')
    expect(new Int64Wrapper(-3.9).toString()).to.equal('-3')
  }

  @test
  public 'add positive value'(): void {
    const wrapped = new Int64Wrapper(1000)
    const result = wrapped.add(500)
    expect(wrapped.toString()).to.equal('1500')
    expect(wrapped.toNumber()).to.equal(1500)
    // add is fluent and mutates the same instance
    expect(result).to.equal(wrapped)
  }

  @test
  public 'add negative value'(): void {
    expect(new Int64Wrapper(10).add(-21).toString()).to.equal('-11')
  }

  @test
  public 'add truncates fractional argument'(): void {
    expect(new Int64Wrapper(1).add(2.9).toNumber()).to.equal(3)
  }

  @test
  public 'keeps exact value beyond double precision in toString'(): void {
    // 2^61 + 1 is not representable as a double: toNumber() rounds the +1
    // away, but toString() keeps the exact 64-bit value.
    const wrapped = new Int64Wrapper(2 ** 61).add(1)
    expect(wrapped.toString()).to.equal('2305843009213693953')
    // expected double built from a string so the test source stays precision-safe
    expect(wrapped.toNumber()).to.equal(Number(BigInt('2305843009213693953')))
  }

  @test
  public 'wraps around the signed int64 boundary (2^63 -> -2^63)'(): void {
    let wrapped = new Int64Wrapper(0)
    const step = 2 ** 53
    for (let i = 0; i < 1024; i++) {
      wrapped = wrapped.add(step)
    }
    expect(wrapped.toString()).to.equal('-9223372036854775808')
    // expected double is Number(-2^63), built from a string to stay precision-safe
    expect(wrapped.toNumber()).to.equal(Number(BigInt('-9223372036854775808')))
  }

  @test
  public 'wraps around two 64-bit magnitudes back to zero'(): void {
    let wrapped = new Int64Wrapper(0)
    const step = 2 ** 53
    for (let i = 0; i < 2048; i++) {
      wrapped = wrapped.add(step)
    }
    expect(wrapped.toString()).to.equal('')
    expect(wrapped.toNumber()).to.equal(0)
  }
}
