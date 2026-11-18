// @last-edited: 2026-11-09 UTC+7.
// @title: scripted-device — the socket a test drives, speaking the frames the real extension speaks.
// @state: hello, the heartbeat, the ping proof, the command, and the completion, driven over one socket against a real bridge.
// @dependencies: ../../extension/lib/socket-protocol.js.

// THIS FILE EXISTS

// The bridge answers a real socket, and two suites in this repo prove it.
// Each suite used to carry its own copy of the scripted device, and the two copies drifted apart in what they were willing to answer — which is not a fact about the bridge, just about the copy.
// One helper answers a ping, answers a command with the caller's handler, and records everything it was asked, so a test asserts what the bridge actually sent.

import { completionFrame, handshakeFrame, normalizeCommand, pongFrame } from '../../extension/lib/socket-protocol.js';
import type { SocketCommand } from '../../extension/lib/socket-protocol.js';

export function createScriptedDevice({ url, handle = () => [], answerProof = true, deaf = false, instanceId = undefined, token = '', deviceName = 'scripted' }: { url?: string | undefined; handle?: (command: SocketCommand) => unknown; answerProof?: boolean | undefined; deaf?: boolean | undefined; instanceId?: string | undefined; token?: string | undefined; deviceName?: string | undefined } = {}) {
  const seen: any = [];
  const events: Array<Record<string, unknown>> = [];
  let socket: WebSocket | null = null;
  let open = false;
  let resolveClosed: ((info: { code: number; reason: string }) => void) | null = null;
  const closed = new Promise<{ code: number; reason: string }>((resolve) => { resolveClosed = resolve; });

  const connected = new Promise<void>((resolve, reject) => {
    if (typeof url !== 'string' || url.length === 0) {
      reject(new Error('the scripted device needs a url to connect to'));
      return;
    }
    const ws = new WebSocket(url);
    socket = ws;
    ws.addEventListener('open', () => {
      open = true;
      ws.send(handshakeFrame(token, deviceName, instanceId));
      resolve();
    });
    ws.addEventListener('error', () => reject(new Error('the scripted device could not connect')));
    ws.addEventListener('close', (event) => {
      open = false;
      resolveClosed?.({ code: event.code, reason: event.reason });
    });
    ws.addEventListener('message', (event) => {
      let frame;
      try {
        frame = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
      } catch {
        return;
      }
      events.push(frame);
      if (frame.type === 'ping') {
        if (!deaf) ws.send(pongFrame());
        return;
      }
      if (frame.type !== 'command') return;

      const command = normalizeCommand(frame);
      if (!command) return;
      seen.push(command);
      if (deaf) return;
      if (command.method === 'ping') {
        if (answerProof) ws.send(completionFrame(command.id, true, { pong: true }));
        return;
      }
      Promise.resolve()
        .then(() => handle(command))
        .then((result) => { ws.send(completionFrame(command.id, true, result)); })
        .catch((error) => { ws.send(completionFrame(command.id, false, null, { code: 'EXECUTION_ERROR', message: String(error) })); });
    });
  });

  return {
    seen,
    events,
    closed,
    connected,
    pings: () => seen.filter((command: { method: string }) => command.method === 'ping').length,
    // THIS CLOSE COMES WITH A SETTLE.
    // The close event races the end of the test; giving it a beat to land keeps the next test from being answered by a socket that was still dying.
    async stop() {
      if (open && socket) socket.close();
      await Promise.race([connected, new Promise((resolve) => setTimeout(resolve, 250))]);
    }
  };
}

export function scriptedDevice(url: string, handle: (command: SocketCommand) => unknown, { answerProof = true, deaf = false, instanceId = undefined }: { answerProof?: boolean | undefined; deaf?: boolean | undefined; instanceId?: string | undefined } = {}) {
  return createScriptedDevice({ url, handle, answerProof, deaf, instanceId });
}
