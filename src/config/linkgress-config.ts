import { DEFAULT_IN_ARRAY_OPT_THRESHOLD, getInArrayOptThreshold, setInArrayOptThreshold } from '../query/conditions';

/** Settings accepted by {@link LinkgressConfig.configure}; a key left out keeps its current value. */
export interface LinkgressSettings {
  /** See {@link LinkgressConfig.inArrayOptThreshold}. */
  inArrayOptThreshold?: number;
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

  /** Apply several settings at once; keys left out keep their current value. */
  static configure(settings: LinkgressSettings): void {
    if (settings.inArrayOptThreshold !== undefined) {
      setInArrayOptThreshold(settings.inArrayOptThreshold);
    }
  }

  /** Every setting back to its default. */
  static resetToDefaults(): void {
    setInArrayOptThreshold(DEFAULT_IN_ARRAY_OPT_THRESHOLD);
  }
}
