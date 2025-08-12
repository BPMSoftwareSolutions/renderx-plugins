export type MusicalDynamic = 'pp'|'p'|'mp'|'mf'|'f'|'ff'|string;
export type MusicalTiming = 'immediate'|'on-demand'|'scheduled'|string;
export type SequenceCategory = 'ui'|'orchestration'|'data'|string;

export interface SequenceBeat {
  beat: number;
  event: string;
  title?: string;
  handler?: string;
  dynamics?: MusicalDynamic;
  timing?: MusicalTiming;
}

export interface SequenceMovement {
  id: string;
  name: string;
  description?: string;
  beats: SequenceBeat[];
}

export interface MusicalSequence {
  id: string;
  name: string;
  description?: string;
  version?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  category?: SequenceCategory;
  movements: SequenceMovement[];
  events?: { triggers?: string[]; emits?: string[] };
  configuration?: Record<string, any>;
}

export const MUSICAL_DYNAMICS = {
  PP: 'pp', P: 'p', MP: 'mp', MF: 'mf', F: 'f', FF: 'ff'
} as const;

export const MUSICAL_TIMING = {
  IMMEDIATE: 'immediate', ON_DEMAND: 'on-demand', SCHEDULED: 'scheduled'
} as const;

export const SEQUENCE_CATEGORIES = {
  UI: 'ui', ORCHESTRATION: 'orchestration', DATA: 'data'
} as const;

