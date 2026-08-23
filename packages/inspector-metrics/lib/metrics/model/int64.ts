/**
 * Pure-JS `int64_t` value backed by a native `BigInt`.
 *
 * This replaces the former `node-cint64` native dependency so that the core
 * `inspector-metrics` package no longer requires a mandatory native build.
 *
 * The stored value is always kept within the signed 64-bit range. Arithmetic
 * emulates two's-complement wrap-around, and the numeric / string conversions
 * reproduce the previous `node-cint64` `Int64` semantics: a `number` argument
 * is truncated toward zero (as the native `(double) -> int64_t` cast does), and
 * {@link toNumber} returns the closest `double` representation of the 64-bit
 * value.
 */
export class Int64Wrapper {
  /**
   * 2**64 - 1, all 64 bits set. Used to mask the low 64 bits when wrapping.
   *
   * @static
   * @private
   * @type {bigint}
   * @memberof Int64Wrapper
   */
  private static readonly MASK64: bigint = BigInt(2) ** BigInt(64) - BigInt(1)

  /**
   * 2**63, the count of non-negative representable values (the wrap bias).
   *
   * @static
   * @private
   * @type {bigint}
   * @memberof Int64Wrapper
   */
  private static readonly BIAS: bigint = BigInt(2) ** BigInt(63)

  /**
   * int64_t value instance.
   *
   * @private
   * @type {bigint}
   * @memberof Int64Wrapper
   */
  private num: bigint

  /**
   * Converts the given number to an arbitrary-precision integer, truncating
   * the fractional part toward zero to match the native double-to-int64 cast.
   * Non-finite values are mapped to zero (the native cast result was
   * undefined for them).
   *
   * @static
   * @private
   * @param {number} value
   * @returns {bigint}
   * @memberof Int64Wrapper
   */
  private static toBigInt(value: number): bigint {
    if (!Number.isFinite(value)) {
      return BigInt(0)
    }
    return BigInt(Math.trunc(value))
  }

  /**
   * Constrains the given arbitrary-precision integer to the signed 64-bit
   * range using two's-complement wrap-around (e.g. 2**63 wraps to -2**63).
   *
   * @static
   * @private
   * @param {bigint} value the value to wrap
   * @returns {bigint}
   * @memberof Int64Wrapper
   */
  private static wrap64(value: bigint): bigint {
    const low = value & Int64Wrapper.MASK64
    return low >= Int64Wrapper.BIAS ? low - Int64Wrapper.BIAS * BigInt(2) : low
  }

  /**
   * Creates an instance of Int64Wrapper, converting the given number into the
   * signed 64-bit range.
   *
   * @param {number} [initial=0]
   * @memberof Int64Wrapper
   */
  public constructor(initial: number = 0) {
    this.num = Int64Wrapper.wrap64(Int64Wrapper.toBigInt(initial))
  }

  /**
   * Adds the specified value to the stored 64-bit integer, wrapping on
   * overflow. Mutates and returns `this` for chaining.
   *
   * @param {number} value
   * @returns {this}
   * @memberof Int64Wrapper
   */
  public add(value: number): this {
    this.num = Int64Wrapper.wrap64(this.num + Int64Wrapper.toBigInt(value))
    return this
  }

  /**
   * Gets the 64-bit value as the closest javascript double-precision number.
   *
   * @returns {number}
   * @memberof Int64Wrapper
   */
  public toNumber(): number {
    return Number(this.num)
  }

  /**
   * Converts the 64-bit integer to its decimal string representation.
   *
   * Like the native `node-cint64` this reproduces, a zero value is rendered as
   * an empty string (the underlying C++ conversion leaves the buffer empty for
   * zero). Consumers such as the Prometheus reporter rely on that being
   * falsy (`getSum().toString() || 0`).
   *
   * @returns {string}
   * @memberof Int64Wrapper
   */
  public toString(): string {
    return this.num === BigInt(0) ? '' : this.num.toString()
  }
}
