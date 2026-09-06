import {
  DEFAULT_IN_ARRAY_OPT_THRESHOLD,
  DEFAULT_IN_ARRAY_PAD_BUCKETS,
  getInArrayOptThreshold,
  getInArrayPadBuckets,
  setInArrayOptThreshold,
  setInArrayPadBuckets,
} from '../query/conditions';

/** Settings accepted by {@link LinkgressConfig.configure}; a key left out keeps its current value. */
export interface LinkgressSettings {
  /** See {@link LinkgressConfig.inArrayOptThreshold}. */
  inArrayOptThreshold?: number;
  /** See {@link LinkgressConfig.inArrayPadBuckets}; `null` switches padding off. */
  inArrayPadBuckets?: readonly number[] | null;
}

/**
 * Process-wide linkgress settings — the one place a consumer configures behaviour that belongs
 * to neither a context nor a query.
 *
 * Why a static class over exported setter functions: the settings are read on hot paths
 * (`inArrayOpt` consults its threshold on every call) and therefore live as module-level
 * variables next to the code that reads them, so a read stays a plain variable access. The
 * functions that write those variables are internal to the library; this class is the public
 * surface and the only one the package exports.
 *
 * @example
 * LinkgressConfig.inArrayOptThreshold = 12;             // lists up to 12 elements render IN ($1, …)
 * LinkgressConfig.configure({ inArrayOptThreshold: 12 });
 * LinkgressConfig.resetToDefaults();                     // test isolation
 */
export class LinkgressConfig {
  /** The threshold {@link inArrayOptThreshold} starts at. */
  static readonly DEFAULT_IN_ARRAY_OPT_THRESHOLD = DEFAULT_IN_ARRAY_OPT_THRESHOLD;

  /**
   * List length up to which `inArrayOpt` / `notInArrayOpt` render an `IN (…)` placeholder list;
   * a longer list binds as ONE array parameter (`= ANY(…)` / `<> ALL(…)`). `0` sends every
   * non-empty list to the array form. Must be a non-negative integer — anything else throws
   * and leaves the current value in place. `QueryOptions.inArrayOptThreshold` writes this same
   * value when a context is constructed with it.
   */
  static get inArrayOptThreshold(): number {
    return getInArrayOptThreshold();
  }

  static set inArrayOptThreshold(threshold: number) {
    setInArrayOptThreshold(threshold);
  }

  /** A sensible ladder to hand {@link inArrayPadBuckets}. Not applied unless you set it. */
  static readonly DEFAULT_IN_ARRAY_PAD_BUCKETS = DEFAULT_IN_ARRAY_PAD_BUCKETS;

  /**
   * OPT-IN. Widths `inArrayOpt` / `notInArrayOpt` are allowed to render below the threshold.
   * `null` (the default) renders one placeholder per element, so a family whose lists range over
   * 1…8 elements leaves eight statement texts on every pooled connection. Given a ladder, each
   * list is rounded up to the next rung and the gap filled by repeating its last element — four
   * texts for `[1, 4, 8]`, returning exactly the same rows, since `x IN (a, b, b)` selects what
   * `x IN (a, b)` does and likewise for `NOT IN`.
   *
   * The rungs must be positive integers in strictly ascending order; anything else throws and
   * leaves the current ladder in place. A list longer than the top rung is widened to the
   * threshold, so raising the threshold extends the ladder rather than dropping lengths out of it.
   *
   * What it costs: a widened statement is planned for its rung, not for the list that arrives.
   * Measured on PostgreSQL 18, that is free from three elements up but worth ~32 % on
   * single-element lists and ~26 % on two-element ones — so keep the low rungs tight.
   * `[1, 2, 8]` is the variant that pays nothing, for the same number of texts as `[1, 4, 8]`.
   *
   * @example
   * LinkgressConfig.inArrayPadBuckets = LinkgressConfig.DEFAULT_IN_ARRAY_PAD_BUCKETS; // [1, 4, 8]
   * LinkgressConfig.inArrayPadBuckets = null;                                          // back off
   */
  static get inArrayPadBuckets(): readonly number[] | null {
    return getInArrayPadBuckets();
  }

  static set inArrayPadBuckets(buckets: readonly number[] | null) {
    setInArrayPadBuckets(buckets);
  }

  /** Apply several settings at once; keys left out keep their current value. */
  static configure(settings: LinkgressSettings): void {
    if (settings.inArrayOptThreshold !== undefined) {
      setInArrayOptThreshold(settings.inArrayOptThreshold);
    }

    if (settings.inArrayPadBuckets !== undefined) {
      setInArrayPadBuckets(settings.inArrayPadBuckets);
    }
  }

  /** Every setting back to its default. */
  static resetToDefaults(): void {
    setInArrayOptThreshold(DEFAULT_IN_ARRAY_OPT_THRESHOLD);
    setInArrayPadBuckets(null);
  }
}
