import type { MusicalSequence } from '../../SequenceTypes';
import { EventBus } from '../../EventBus';

export class SequenceRegistry {
  private sequences: Map<string, MusicalSequence> = new Map();
  constructor(private eventBus: EventBus) {}

  register(seq: MusicalSequence) {
    if (!seq || !seq.id) throw new Error('Invalid sequence');
    if (this.sequences.has(seq.id)) throw new Error(`Sequence already registered: ${seq.id}`);
    this.sequences.set(seq.id, seq);
  }

  getSequenceNames(): string[] {
    return Array.from(this.sequences.keys());
  }
}

