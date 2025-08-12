/**
 * Mock Sequences for Testing
 * Pre-defined musical sequences for various test scenarios
 */

import type { MusicalSequence } from "@communication/sequences/SequenceTypes";
import {
  MUSICAL_DYNAMICS,
  MUSICAL_TIMING,
  SEQUENCE_CATEGORIES,
} from "@communication/sequences/SequenceTypes";

/**
 * Basic test sequence with 3 beats
 */
export const BASIC_TEST_SEQUENCE: MusicalSequence = {
  id: "basic-test-sequence",
  name: "Basic Test Sequence",
  description: "Simple 3-beat sequence for basic testing",
  key: "C Major",
  tempo: 120,
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.COMPONENT_UI,
  movements: [
    {
      id: "basic-movement",
      name: "Basic Movement",
      description: "Simple movement with 3 beats",
      beats: [
        {
          beat: 1,
          event: "test-start",
          title: "Start Beat",
          description: "Initial beat to start the sequence",
          dynamics: MUSICAL_DYNAMICS.FORTE,
          timing: MUSICAL_TIMING.IMMEDIATE,
          data: { phase: "start", test: true },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "test-process",
          title: "Process Beat",
          description: "Middle beat for processing",
          dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { phase: "process", test: true },
          errorHandling: "continue",
        },
        {
          beat: 3,
          event: "test-complete",
          title: "Complete Beat",
          description: "Final beat to complete the sequence",
          dynamics: MUSICAL_DYNAMICS.PIANO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { phase: "complete", test: true },
          errorHandling: "continue",
        },
      ],
    },
  ],
};

/**
 * Fast tempo sequence for timing tests
 */
export const FAST_TEMPO_SEQUENCE: MusicalSequence = {
  id: "fast-tempo-test",
  name: "Fast Tempo Test",
  description: "High-speed sequence for timing validation",
  key: "D Major",
  tempo: 240, // 250ms per beat
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.PERFORMANCE,
  movements: [
    {
      id: "speed-movement",
      name: "Speed Movement",
      description: "Fast-paced movement",
      beats: [
        {
          beat: 1,
          event: "fast-beat-1",
          title: "Fast Beat 1",
          description: "First fast beat",
          dynamics: MUSICAL_DYNAMICS.FORTISSIMO,
          timing: MUSICAL_TIMING.IMMEDIATE,
          data: { speed: "fast", beat: 1 },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "fast-beat-2",
          title: "Fast Beat 2",
          description: "Second fast beat",
          dynamics: MUSICAL_DYNAMICS.FORTISSIMO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { speed: "fast", beat: 2 },
          errorHandling: "continue",
        },
        {
          beat: 3,
          event: "fast-beat-3",
          title: "Fast Beat 3",
          description: "Third fast beat",
          dynamics: MUSICAL_DYNAMICS.FORTISSIMO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { speed: "fast", beat: 3 },
          errorHandling: "continue",
        },
      ],
    },
  ],
};

/**
 * Mixed timing sequence for complex timing tests
 */
export const MIXED_TIMING_SEQUENCE: MusicalSequence = {
  id: "mixed-timing-test",
  name: "Mixed Timing Test",
  description: "Sequence with different timing patterns",
  key: "A Minor",
  tempo: 120,
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.COMPONENT_UI,
  movements: [
    {
      id: "timing-variety-movement",
      name: "Timing Variety Movement",
      description: "Movement with various timing patterns",
      beats: [
        {
          beat: 1,
          event: "immediate-beat",
          title: "Immediate Beat",
          description: "Beat that fires immediately",
          dynamics: MUSICAL_DYNAMICS.FORTE,
          timing: MUSICAL_TIMING.IMMEDIATE,
          data: { timing: "immediate" },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "on-beat",
          title: "On Beat",
          description: "Beat that fires on the musical beat",
          dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { timing: "on-beat" },
          errorHandling: "continue",
        },
        {
          beat: 3,
          event: "delayed-beat",
          title: "Delayed Beat",
          description: "Beat that fires with delay",
          dynamics: MUSICAL_DYNAMICS.PIANO,
          timing: MUSICAL_TIMING.DELAYED,
          data: { timing: "delayed" },
          errorHandling: "continue",
        },
      ],
    },
  ],
};

/**
 * Error handling sequence for error testing
 */
export const ERROR_HANDLING_SEQUENCE: MusicalSequence = {
  id: "error-handling-test",
  name: "Error Handling Test",
  description: "Sequence designed to test error handling",
  key: "F# Minor",
  tempo: 120,
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.SYSTEM,
  movements: [
    {
      id: "error-movement",
      name: "Error Movement",
      description: "Movement with error scenarios",
      beats: [
        {
          beat: 1,
          event: "normal-beat",
          title: "Normal Beat",
          description: "Regular beat that should work fine",
          dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { type: "normal" },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "error-beat",
          title: "Error Beat",
          description: "Beat designed to cause errors",
          dynamics: MUSICAL_DYNAMICS.FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { type: "error", shouldFail: true },
          errorHandling: "abort",
        },
        {
          beat: 3,
          event: "recovery-beat",
          title: "Recovery Beat",
          description: "Beat that should run after error recovery",
          dynamics: MUSICAL_DYNAMICS.PIANO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { type: "recovery" },
          errorHandling: "continue",
        },
      ],
    },
  ],
};

/**
 * Multi-movement sequence for complex orchestration tests
 */
export const MULTI_MOVEMENT_SEQUENCE: MusicalSequence = {
  id: "multi-movement-symphony",
  name: "Multi-Movement Symphony",
  description: "Complex sequence with multiple movements",
  key: "Bb Major",
  tempo: 120,
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.LAYOUT,
  movements: [
    {
      id: "first-movement-allegro",
      name: "First Movement - Allegro",
      description: "Opening movement",
      beats: [
        {
          beat: 1,
          event: "movement-1-start",
          title: "Movement 1 Start",
          description: "Start of first movement",
          dynamics: MUSICAL_DYNAMICS.FORTE,
          timing: MUSICAL_TIMING.IMMEDIATE,
          data: { movement: 1, phase: "start" },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "movement-1-develop",
          title: "Movement 1 Development",
          description: "Development in first movement",
          dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { movement: 1, phase: "develop" },
          errorHandling: "continue",
        },
      ],
    },
    {
      id: "second-movement-andante",
      name: "Second Movement - Andante",
      description: "Slow movement",
      beats: [
        {
          beat: 1,
          event: "movement-2-start",
          title: "Movement 2 Start",
          description: "Start of second movement",
          dynamics: MUSICAL_DYNAMICS.PIANO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { movement: 2, phase: "start" },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "movement-2-climax",
          title: "Movement 2 Climax",
          description: "Climax of second movement",
          dynamics: MUSICAL_DYNAMICS.FORTE,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { movement: 2, phase: "climax" },
          errorHandling: "continue",
        },
      ],
    },
    {
      id: "third-movement-finale",
      name: "Third Movement - Finale",
      description: "Concluding movement",
      beats: [
        {
          beat: 1,
          event: "finale-start",
          title: "Finale Start",
          description: "Start of finale",
          dynamics: MUSICAL_DYNAMICS.FORTISSIMO,
          timing: MUSICAL_TIMING.IMMEDIATE,
          data: { movement: 3, phase: "finale" },
          errorHandling: "continue",
        },
        {
          beat: 2,
          event: "finale-end",
          title: "Finale End",
          description: "Grand finale",
          dynamics: MUSICAL_DYNAMICS.FORTISSIMO,
          timing: MUSICAL_TIMING.ON_BEAT,
          data: { movement: 3, phase: "end" },
          errorHandling: "continue",
        },
      ],
    },
  ],
};

/**
 * Performance test sequence with many beats
 */
export const PERFORMANCE_TEST_SEQUENCE: MusicalSequence = {
  id: "performance-test-sequence",
  name: "Performance Test Sequence",
  description: "Large sequence for performance testing",
  key: "C Major",
  tempo: 240, // Fast tempo for performance testing
  timeSignature: "4/4",
  category: SEQUENCE_CATEGORIES.PERFORMANCE,
  movements: [
    {
      id: "performance-movement",
      name: "Performance Movement",
      description: "High-volume beat movement",
      beats: Array.from({ length: 50 }, (_, i) => ({
        beat: i + 1,
        event: `perf-beat-${i + 1}`,
        title: `Performance Beat ${i + 1}`,
        description: `Performance test beat number ${i + 1}`,
        dynamics: MUSICAL_DYNAMICS.MEZZO_FORTE,
        timing: MUSICAL_TIMING.ON_BEAT,
        data: { beatNumber: i + 1, performance: true },
        errorHandling: "continue" as const,
      })),
    },
  ],
};

/**
 * Collection of all test sequences
 */
export const TEST_SEQUENCES = {
  BASIC_TEST_SEQUENCE,
  FAST_TEMPO_SEQUENCE,
  MIXED_TIMING_SEQUENCE,
  ERROR_HANDLING_SEQUENCE,
  MULTI_MOVEMENT_SEQUENCE,
  PERFORMANCE_TEST_SEQUENCE,
};

/**
 * Get a test sequence by name
 */
export function getTestSequence(
  name: keyof typeof TEST_SEQUENCES
): MusicalSequence {
  return TEST_SEQUENCES[name];
}

/**
 * Get all test sequence names
 */
export function getTestSequenceNames(): string[] {
  return Object.values(TEST_SEQUENCES).map((seq) => seq.name);
}
