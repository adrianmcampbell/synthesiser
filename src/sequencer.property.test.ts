import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { computeStepTime } from './sequencer.js';

/**
 * Property 6: Swing step timing
 * Validates: Requirements 1.8
 *
 * For any baseTime >= 0, stepIndex (integer 0–15), stepDuration > 0, swing in [0, 0.33]:
 *   - Even steps: computeStepTime returns baseTime unchanged
 *   - Odd steps:  computeStepTime returns baseTime + stepDuration * swing
 */
describe('Property 6: Swing step timing', () => {
  it('applies swing offset correctly for even and odd steps', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(100), noNaN: true }),              // baseTime
        fc.integer({ min: 0, max: 31 }),                                       // stepIndex
        fc.float({ min: Math.fround(0.001), max: 1, noNaN: true }),            // stepDuration
        fc.float({ min: 0, max: Math.fround(0.33), noNaN: true }),             // swing
        (baseTime, stepIndex, stepDuration, swing) => {
          const result = computeStepTime(baseTime, stepIndex, stepDuration, swing);
          if (stepIndex % 2 === 0) {
            return result === baseTime;
          } else {
            return result === baseTime + stepDuration * swing;
          }
        },
      ),
      { numRuns: 500 },
    );
  });
});
