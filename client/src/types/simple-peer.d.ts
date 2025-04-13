declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  export interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: any;
    channelName?: string;
    config?: RTCConfiguration;
    offerOptions?: RTCOfferOptions;
    answerOptions?: RTCAnswerOptions;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    objectMode?: boolean;
  }

  export interface Instance extends EventEmitter {
    signal(data: any): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): void;
    destroy(err?: Error): void;
    readonly connected: boolean;
    readonly destroyed: boolean;
    readonly remoteAddress: string | undefined;
  }

  export default function SimplePeer(opts?: SimplePeerOptions): Instance;
}