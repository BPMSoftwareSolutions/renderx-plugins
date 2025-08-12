/**
 * Sequence Builder Utilities
 * Fluent API for creating test musical sequences
 */

import type {
  MusicalSequence,
  SequenceMovement,
  SequenceBeat,
  MusicalDynamic,
  MusicalTiming,
  SequenceCategory,
} from "@communication/sequences/SequenceTypes";
import {
  MUSICAL_DYNAMICS,
  MUSICAL_TIMING,
  SEQUENCE_CATEGORIES,
} from "@communication/sequences/SequenceTypes";

/**
 * Fluent builder for creating test musical sequences
 */
export class SequenceBuilder {
  private sequence: Partial<MusicalSequence> = {
    movements: [],
  };

  public static toId(prefix: string, name?: string): string {
    const base =
      name
        ?.toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || Math.random().toString(36).slice(2);
    return `${prefix}-${base}`;
  }

  /**
   * Set sequence name
   */
  name(name: string): SequenceBuilder {
    this.sequence.name = name;
    // Auto-generate a stable id from the name if not set
    if (!this.sequence.id) {
      this.sequence.id = SequenceBuilder.toId("sequence", name);
    }
    return this;
  }

  /**
   * Set sequence description
   */
  description(description: string): SequenceBuilder {
    this.sequence.description = description;
    return this;
  }

  /**
   * Set musical key
   */
  key(key: string): SequenceBuilder {
    this.sequence.key = key;
    return this;
  }

  /**
   * Set tempo (BPM)
   */
  tempo(bpm: number): SequenceBuilder {
    this.sequence.tempo = bpm;
    return this;
  }

  /**
   * Set time signature
   */
  timeSignature(signature: string): SequenceBuilder {
    this.sequence.timeSignature = signature;
    return this;
  }

  /**
   * Set sequence category
   */
  category(category: SequenceCategory): SequenceBuilder {
    this.sequence.category = category;
    return this;
  }

  /**
   * Add a movement to the sequence
   */
  addMovement(
    movement: Partial<SequenceMovement> & {
      name: string;
      beats: SequenceBeat[];
    }
  ): SequenceBuilder {
    if (!this.sequence.movements) {
      this.sequence.movements = [];
    }
    // Ensure the movement has an id
    if (!(movement as any).id) {
      (movement as any).id = SequenceBuilder.toId(
        "movement",
        (movement as any).name
      );
    }
    this.sequence.movements.push(movement as SequenceMovement);
    return this;
  }

  /**
   * Build the final sequence
   */
  build(): MusicalSequence {
    if (!this.sequence.name) {
      throw new Error("Sequence name is required");
    }
    if (!this.sequence.movements || this.sequence.movements.length === 0) {
      throw new Error("At least one movement is required");
    }

    return {
      id:
        (this.sequence as any).id ||
        SequenceBuilder.toId("sequence", this.sequence.name),
      name: this.sequence.name,
      description: this.sequence.description || "Test sequence",
      key: this.sequence.key || "C Major",
      tempo: this.sequence.tempo || 120,
      timeSignature: this.sequence.timeSignature || "4/4",
      category: this.sequence.category || SEQUENCE_CATEGORIES.COMPONENT_UI,
      movements: this.sequence.movements as SequenceMovement[],
    } as MusicalSequence;
  }

  /**
   * Create a simple test sequence with default values
   */
  static simple(name: string): SequenceBuilder {
    return new SequenceBuilder()
      .name(name)
      .description(`Test sequence: ${name}`)
      .key("C Major")
      .tempo(120)
      .timeSignature("4/4")
      .category(SEQUENCE_CATEGORIES.COMPONENT_UI);
  }

  /**
   * Create a performance test sequence with many beats
   */
  static performance(name: string, beatCount: number = 100): SequenceBuilder {
    const builder = SequenceBuilder.simple(name);
    const movement = MovementBuilder.simple("Performance Movement")
      .addMultipleBeats(beatCount)
      .build();

    return builder.addMovement(movement);
  }
}

/**
 * Fluent builder for creating test movements
 */
export class MovementBuilder {
  private movement: Partial<SequenceMovement> = {
    beats: [],
  };

  /**
   * Set movement name
   */
  name(name: string): MovementBuilder {
    this.movement.name = name;
    return this;
  }

  /**
   * Set movement description
   */
  description(description: string): MovementBuilder {
    this.movement.description = description;
    return this;
  }

  /**
   * Add a beat to the movement
   */
  addBeat(beat: SequenceBeat): MovementBuilder {
    if (!this.movement.beats) {
      this.movement.beats = [];
    }
    this.movement.beats.push(beat);
    return this;
  }

  /**
   * Add multiple simple beats for performance testing
   */
  addMultipleBeats(
    count: number,
    eventPrefix: string = "test-beat"
  ): MovementBuilder {
    for (let i = 1; i <= count; i++) {
      this.addBeat(BeatBuilder.simple(i, `${eventPrefix}-${i}`).build());
    }
    return this;
  }

  /**
   * Build the final movement
   */
  build(): SequenceMovement {
    if (!this.movement.name) {
      throw new Error("Movement name is required");
    }
    if (!this.movement.beats || this.movement.beats.length === 0) {
      throw new Error("At least one beat is required");
    }

    return {
      id:
        (this.movement as any).id ||
        SequenceBuilder.toId("movement", this.movement.name),
      name: this.movement.name,
      description: this.movement.description || "Test movement",
      beats: this.movement.beats as SequenceBeat[],
    } as SequenceMovement;
  }

  /**
   * Create a simple test movement
   */
  static simple(name: string): MovementBuilder {
    return new MovementBuilder()
      .name(name)
      .description(`Test movement: ${name}`);
  }
}

/**
 * Fluent builder for creating test beats
 */
export class BeatBuilder {
  private _beatState: Partial<SequenceBeat> = {};

  /**
   * Set beat number
   */
  beat(beatNumber: number): BeatBuilder {
    this._beatState.beat = beatNumber;
    return this;
  }

  /**
   * Set event name
   */
  event(eventName: string): BeatBuilder {
    this._beatState.event = eventName;
    return this;
  }

  /**
   * Set beat title
   */
  title(title: string): BeatBuilder {
    this._beatState.title = title;
    return this;
  }

  /**
   * Set beat description
   */
  description(description: string): BeatBuilder {
    this._beatState.description = description;
    return this;
  }

  /**
   * Set musical dynamics
   */
  dynamics(dynamics: MusicalDynamic): BeatBuilder {
    this._beatState.dynamics = dynamics;
    return this;
  }

  /**
   * Set musical timing
   */
  timing(timing: MusicalTiming): BeatBuilder {
    this._beatState.timing = timing;
    return this;
  }

  /**
   * Set beat data
   */
  data(data: any): BeatBuilder {
    this._beatState.data = data;
    return this;
  }

  /**
   * Set error handling strategy
   */
  errorHandling(strategy: "continue" | "abort"): BeatBuilder {
    this._beatState.errorHandling = strategy;
    return this;
  }

  /**
   * Build the final beat
   */
  build(): SequenceBeat {
    if (this._beatState.beat === undefined) {
      throw new Error("Beat number is required");
    }
    if (!this._beatState.event) {
      throw new Error("Event name is required");
    }

    return {
      beat: this._beatState.beat!,
      event: this._beatState.event!,
      title: this._beatState.title || `Beat ${this._beatState.beat}`,
      description:
        this._beatState.description || `Test beat ${this._beatState.beat}`,
      dynamics: this._beatState.dynamics || MUSICAL_DYNAMICS.MEZZO_FORTE,
      timing: this._beatState.timing || MUSICAL_TIMING.ON_BEAT,
      data: this._beatState.data || {},
      errorHandling: this._beatState.errorHandling || "continue",
    } as SequenceBeat;
  }

  /**
   * Create a simple test beat
   */
  static simple(beatNumber: number, eventName: string): BeatBuilder {
    return new BeatBuilder()
      .beat(beatNumber)
      .event(eventName)
      .title(`Test Beat ${beatNumber}`)
      .description(`Test beat ${beatNumber} for ${eventName}`)
      .dynamics(MUSICAL_DYNAMICS.MEZZO_FORTE)
      .timing(MUSICAL_TIMING.ON_BEAT)
      .data({ test: true })
      .errorHandling("continue");
  }

  /**
   * Create an immediate timing beat
   */
  static immediate(beatNumber: number, eventName: string): BeatBuilder {
    return BeatBuilder.simple(beatNumber, eventName).timing(
      MUSICAL_TIMING.IMMEDIATE
    );
  }

  /**
   * Create a delayed timing beat
   */
  static delayed(beatNumber: number, eventName: string): BeatBuilder {
    return BeatBuilder.simple(beatNumber, eventName).timing(
      MUSICAL_TIMING.DELAYED
    );
  }
}

/**
 * Pre-built test sequences for common testing scenarios
 */
export class TestSequences {
  /**
   * Simple 3-beat sequence for basic testing
   */
  static simple(): MusicalSequence {
    return SequenceBuilder.simple("Simple Test Sequence")
      .addMovement(
        MovementBuilder.simple("Test Movement")
          .addBeat(BeatBuilder.simple(1, "test-start").build())
          .addBeat(BeatBuilder.simple(2, "test-middle").build())
          .addBeat(BeatBuilder.simple(3, "test-end").build())
          .build()
      )
      .build();
  }

  /**
   * Fast tempo sequence for timing tests
   */
  static fastTempo(): MusicalSequence {
    return SequenceBuilder.simple("Fast Tempo Test")
      .tempo(240) // 250ms per beat
      .addMovement(
        MovementBuilder.simple("Fast Movement")
          .addBeat(BeatBuilder.simple(1, "fast-beat-1").build())
          .addBeat(BeatBuilder.simple(2, "fast-beat-2").build())
          .addBeat(BeatBuilder.simple(3, "fast-beat-3").build())
          .build()
      )
      .build();
  }

  /**
   * Mixed timing sequence for complex timing tests
   */
  static mixedTiming(): MusicalSequence {
    return SequenceBuilder.simple("Mixed Timing Test")
      .addMovement(
        MovementBuilder.simple("Mixed Movement")
          .addBeat(BeatBuilder.immediate(1, "immediate-beat").build())
          .addBeat(BeatBuilder.simple(2, "on-beat").build())
          .addBeat(BeatBuilder.delayed(3, "delayed-beat").build())
          .build()
      )
      .build();
  }

  /**
   * Error handling sequence for error testing
   */
  static errorHandling(): MusicalSequence {
    return SequenceBuilder.simple("Error Handling Test")
      .addMovement(
        MovementBuilder.simple("Error Movement")
          .addBeat(BeatBuilder.simple(1, "normal-beat").build())
          .addBeat(
            BeatBuilder.simple(2, "error-beat").errorHandling("abort").build()
          )
          .addBeat(BeatBuilder.simple(3, "recovery-beat").build())
          .build()
      )
      .build();
  }
}
