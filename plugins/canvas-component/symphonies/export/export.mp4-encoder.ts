// Minimal MP4 encoder module to satisfy tests. In tests, this module is fully mocked.
// Provide stubs that are safe in jsdom and SSR environments.

export type MP4EncoderOptions = {
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
};

export interface MP4Encoder {
  initialize(): Promise<void>;
  addFrame(frame: any): void;
  finalize(): Promise<Blob>;
  setProgressCallback(cb: (progress: number) => void): void;
  setCompleteCallback(cb: (blob: Blob) => void): void;
  setErrorCallback(cb: (err: unknown) => void): void;
}

class BaseEncoder implements MP4Encoder {
  protected onProgress?: (progress: number) => void;
  protected onComplete?: (blob: Blob) => void;
  protected onError?: (err: unknown) => void;

  constructor(_opts?: MP4EncoderOptions) {}

  async initialize(): Promise<void> {
    // no-op
  }

  addFrame(_frame: any): void {
    // no-op
  }

  async finalize(): Promise<Blob> {
    // Return a small empty mp4-like blob
    return new Blob([""], { type: "video/mp4" });
  }

  setProgressCallback(cb: (progress: number) => void): void {
    this.onProgress = cb;
  }
  setCompleteCallback(cb: (blob: Blob) => void): void {
    this.onComplete = cb;
  }
  setErrorCallback(cb: (err: unknown) => void): void {
    this.onError = cb;
  }
}

export class WebCodecsMP4Encoder extends BaseEncoder {
  constructor(opts?: MP4EncoderOptions) {
    super(opts);
  }
}

export class MediaRecorderMP4Encoder extends BaseEncoder {
  constructor(opts?: MP4EncoderOptions) {
    super(opts);
  }
}

export async function createMP4Encoder(
  opts: MP4EncoderOptions = {}
): Promise<MP4Encoder> {
  // In real browser runtime you'd detect WebCodecs/MediaRecorder support.
  // For tests this will be mocked; return a basic instance as a fallback.
  return new WebCodecsMP4Encoder(opts);
}

