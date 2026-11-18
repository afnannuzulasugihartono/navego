// @last-edited: 2026-10-14 UTC+7.
// @title: bridge-ws.test â€” the loopback server pushes, settles, and keeps the worker alive.
// @state: integration pins over a real socket pair on an ephemeral port.
// @dependencies: node:test, strict, node:http, ../local/bridge-ws.js, ../extension/lib/socket-protocol.js.

// A REAL SOCKET HERE.
// The frame codec is unit-pinned separately; what can only be proven over a real connection is the part that actually failed in production: a handshake that completes, a command that arrives the instant it is sent, a completion that settles the caller, and a heartbeat that keeps an otherwise idle worker from dying.
// A mock proves none of those.

process.env.NAVEGO_BRIDGE_TOKEN = 'test-bridge-token';

import test from 'node:test';
import assert from 'node:assert/strict';
import { connect as netConnect } from 'node:net';
import { request as httpRequest } from 'node:http';

import { createBridgeServer } from '../../local/bridge-ws.js';
import { fakeCloud } from '../helpers/fake-cloud.ts';
import { acceptKey, encodeText } from '../../local/ws-server.js';
import { parseFrame } from '../../extension/lib/socket-protocol.js';

interface FrameCommand {
  readonly id: string;
  readonly method: string;
}

interface FrameMessage {
  readonly type: string;
  readonly command?: FrameCommand | undefined;
  readonly [key: string]: unknown;
}

type DeviceFrame =
  | { readonly ok: true; readonly message: FrameMessage; readonly raw: string }
  | { readonly ok: false; readonly error: string; readonly raw: string };

interface TestDevice {
  readonly frames: DeviceFrame[];
  readonly key: string;
  readonly accepted: boolean;
  push(text: string): void;
  close(): void;
}

interface BridgeAnswer {
  readonly ok: boolean;
  readonly result?: unknown;
  readonly error?: { readonly message?: unknown } | undefined;
  readonly ms: number;
}
const asAnswer = (value: unknown): BridgeAnswer => value as BridgeAnswer;

interface PostAnswer {
  readonly status: number;
  readonly body: { readonly ok: boolean; readonly result?: unknown; readonly error?: { readonly message?: unknown } | undefined };
}

function connect(port: number, origin?: string): Promise<TestDevice> {
  return new Promise((resolve, reject) => {
    const socket = netConnect(port, '127.0.0.1');
    const key = Buffer.from(`opera-${Date.now()}-${Math.random()}`).toString('base64');
    let buffer = Buffer.alloc(0);
    let upgraded = false;
    const queue: DeviceFrame[] = [];

    socket.on('error', reject);
    socket.on('connect', () => {
      socket.write([
        'GET / HTTP/1.1',
        `Host: 127.0.0.1:${port}`,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
        ...(origin === undefined ? [] : [`Origin: ${origin}`]),
        '', ''
      ].join('\r\n'));
    });
    socket.on('data', (incoming) => {
      let chunk = incoming;
      if (!upgraded) {
        buffer = Buffer.concat([buffer, chunk]);
        const end = buffer.indexOf('\r\n\r\n');
        if (end < 0) return;
        const head = buffer.subarray(0, end).toString();
        upgraded = true;
        buffer = buffer.subarray(end + 4);
        chunk = Buffer.alloc(0);
        resolve({
          frames: queue,
          key,
          accepted: head.includes(acceptKey(key)),
          push: (text: string) => socket.write(encodeText(text)),
          close: () => socket.destroy()
        });
        return;
      }
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        if (buffer.length < 2) return;
        const secondByte = buffer[1];
        if (secondByte === undefined) return;
        const length = secondByte & 0x7f;
        const offset = length < 126 ? 2 : length === 126 ? 4 : 10;
        if (buffer.length < offset + length) return;
        const payload = buffer.subarray(offset, offset + length).toString('utf8');
        buffer = buffer.subarray(offset + length);
        const parsed = parseFrame(payload);
        queue.push(parsed.ok
          ? { ok: true, message: parsed.message as FrameMessage, raw: payload }
          : { ok: false, error: parsed.error, raw: payload });
      }
    });
  });
}

test('a handshake completes and a pushed command arrives without being asked for', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 50 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const device = await connect(port);
  try {
    assert.equal(device.accepted, true, 'the browser-verified accept key came back');
    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));

    const deadline = Date.now() + 2000;
    while (!bridge.linked() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
    assert.equal(bridge.linked(), true, 'the ready frame answered the hello');

    const pending = bridge.send('tabs.list', {}, { timeoutMs: 5000 });
    pending.catch(() => {});
    const commandAt = Date.now();
    while (!device.frames.some((f) => f.ok && f.message.type === 'command') && Date.now() < commandAt + 2000) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const seen = device.frames.map((f) => (f.ok ? f.message.type : `${f.error}:${f.raw}`));
    assert.ok(seen.includes('command'), `the command was pushed, not polled (saw ${seen.join(',')})`);
    const commandFrame = device.frames.find((f): f is Extract<DeviceFrame, { ok: true }> => f.ok && f.message.type === 'command');
    assert.ok(commandFrame, 'the command arrived pushed, not polled');
    const command = commandFrame.message;
    assert.ok(command.command);
    assert.equal(command.command.method, 'tabs.list', 'the command arrived pushed, not polled');

    device.push(JSON.stringify({ type: 'complete', commandId: command.command.id, ok: true, result: [{ id: 7, url: 'https://x/', title: 'X' }] }));
    const answer = asAnswer(await pending);
    const rows = answer.result as Array<{ id: number; url: string }>;
    const firstRow = rows[0];
    assert.ok(firstRow);
    assert.equal(answer.ok, true);
    assert.equal(rows.length, 1, 'the merged list reaches the caller');
    assert.equal(firstRow.id % 10000000000, 7, 'the row names the browser that owns it');
    assert.equal(firstRow.url, 'https://x/');
    assert.ok(answer.ms < 200, 'a loopback round trip is milliseconds, not the relay second');
  } finally {
    device.close();
    await bridge.close();
  }
});

test('an idle connection keeps receiving heartbeats so the worker never dies', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 40 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const device = await connect(port);
  try {
    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));
    const deadline = Date.now() + 2000;
    while (device.frames.filter((f) => f.ok && f.message.type === 'ping').length < 2 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const pings = device.frames.filter((f) => f.ok && f.message.type === 'ping').length;
    assert.ok(pings >= 2, `heartbeat frames arrived without being asked for (saw ${pings})`);
  } finally {
    device.close();
    await bridge.close();
  }
});

test('a device that never answers fails the caller instead of hanging forever', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 1000 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const device = await connect(port);
  try {
    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));
    const deadline = Date.now() + 2000;
    while (!bridge.linked() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));
    await assert.rejects(() => bridge.send('tabs.list', {}, { timeoutMs: 120 }), /no answer for tabs.list within 120 ms/);
  } finally {
    device.close();
    await bridge.close();
  }
});

// THIS ONE EXISTS.
// The device refuses any command it has not been given a `ready` for, and it refuses it by dropping the frame without a word.
// The server used to push the moment the socket attached, so the first command of every connection was thrown away in a window a few milliseconds wide â€” and the caller saw a call that simply never answered.
// It cost one test in three full-suite runs, and in a browser it would have cost one lost command in a hundred connections, which is a bug nobody ever reports.

test('a command raised before the handshake is held, not lost', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 1000 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const device = await connect(port);
  try {
    const attachedBy = Date.now() + 2000;
    while (!bridge.linked() && Date.now() < attachedBy) await new Promise((r) => setTimeout(r, 10));
    assert.equal(bridge.linked(), true, 'a socket is attached before it has said hello');

    const pending = bridge.send('tabs.list', {}, { timeoutMs: 5000 });
    pending.catch(() => {});
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(device.frames.filter((f) => f.ok && f.message.type === 'command').length, 0,
      'nothing is pushed to a device that has not proved itself');

    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));

    const commandAt = Date.now() + 3000;
    while (!device.frames.some((f) => f.ok && f.message.type === 'command') && Date.now() < commandAt) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const commandFrame = device.frames.find((f): f is Extract<DeviceFrame, { ok: true }> => f.ok && f.message.type === 'command');
    assert.ok(commandFrame, 'the held command is delivered the instant the handshake lands');
    const command = commandFrame.message;
    assert.ok(command.command);
    assert.equal(command.command.method, 'tabs.list');

    device.push(JSON.stringify({ type: 'complete', commandId: command.command.id, ok: true, result: { tabs: [] } }));
    const answer = asAnswer(await pending);
    assert.equal(answer.ok, true, 'and it still settles its caller');
  } finally {
    device.close();
    await bridge.close();
  }
});

// THIS HELPER EXISTS SEPARATELY.
// A socket driven by `node:http` is what a real WebSocket client looks like to this server, and it is the only client that reproduces the bug below: it destroys an upgraded connection without the server ever seeing a close.
// The raw socket above closes cleanly on destroy, so it cannot show the failure and would leave the test proving nothing.

// THE HANDSHAKE KEY IS NOT THE SPEC'S OWN SAMPLE.
// RFC 6455 opens with the nonce 'the sample nonce', and the secret scanner reads any base64 sitting next to the word key as a credential - correctly, and wrongly here.
// The server accepts any sixteen-byte key, so these use sixteen zero bytes.

function upgradeOnce(port: number, origin?: string) {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': 'AAAAAAAAAAAAAAAAAAAAAA=='
    };
    if (origin !== undefined) headers.Origin = origin;
    const req = httpRequest({ host: '127.0.0.1', port, path: '/', headers });
    req.on('upgrade', (_res, socket) => { socket.destroy(); resolve(101); });
    req.on('response', (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
}

// THIS ONE EXISTS.
// Node detaches an upgraded socket from the tracking `server.close()` waits on, so a device whose socket was destroyed without a close handshake left the server counting a connection that never ended.
// Measured: `server.close()` never called back, and a driver shutdown hung on a bridge nobody was using.
// A device that reconnects is how it happens in production â€” the worker is killed, comes back, and the socket it left behind is still counted.

test('a reconnecting device leaves nothing behind that closing waits on', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 1000 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;

  assert.equal(await upgradeOnce(port, 'chrome-extension://ofgemipoobcnbjkfanmofjbdonjapmgl'), 101);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(await upgradeOnce(port, 'http://127.0.0.1'), 101);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(await upgradeOnce(port, 'https://notlocalhost'), 400, 'a lookalike host is turned away');
  await new Promise((r) => setTimeout(r, 300));

  const settled = await Promise.race([
    bridge.close().then(() => 'closed'),
    new Promise((resolve) => setTimeout(() => resolve('hung'), 3000))
  ]);
  assert.equal(settled, 'closed', 'close ends the sockets it accepted rather than waiting on them');
});

// TIME IS FAKE HERE.
// The reap line sits at two minutes, and a test that waits it out is a test nobody runs.
// The server takes its clock injected, so fake time jumps past the line while real timers run the heartbeats â€” silence gets reaped, traffic never does, all in under a second.

test('a busy socket survives its second minute and a silent one does not', async () => {
  let at = 1000000;
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 30, now: () => at });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const link = async (device: TestDevice) => {
    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));
    const deadline = Date.now() + 2000;
    while (!bridge.linked() && Date.now() < deadline) await sleep(10);
    assert.equal(bridge.linked(), true, 'the device linked');
    while (!device.frames.some((f) => f.ok && f.message.type === 'ready') && Date.now() < deadline) await sleep(10);
    assert.ok(device.frames.some((f) => f.ok && f.message.type === 'ready'), 'the handshake completed before the clock moves');
  };

  try {
    const quiet = await connect(port);
    await link(quiet);
    at += 125000;
    await sleep(120);
    assert.equal(bridge.linked(), false, 'two silent minutes reap the socket');
    quiet.close();

    const busy = await connect(port);
    await link(busy);
    for (let i = 0; i < 5; i++) {
      at += 30000;
      busy.push(JSON.stringify({ type: 'pong' }));
      await sleep(60);
    }
    assert.equal(bridge.linked(), true, 'a talking socket is never reaped');
    busy.close();
  } finally {
    await bridge.close();
  }
});

// THE DOOR IS PINNED AT THE SERVER, NOT ONLY AT THE CLIENT.
// The client test proves a second driver can drive; this proves the door itself settles a command against the device and reports a device failure as a failure rather than as an empty success.
// A door that answered `ok` with nothing in it would make every adopted call look like it worked.

test('the command door settles against the device and names a device failure', async () => {
  const bridge = createBridgeServer({ cloud: fakeCloud(), port: 0, heartbeatMs: 50 });
  await bridge.listen();
  const address = bridge.address();
  assert.ok(address, 'the bridge bound a port');
  const port = address.port;
  const device = await connect(port);
  const post = (body: Record<string, unknown>): Promise<PostAnswer> => new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = httpRequest({
      host: '127.0.0.1',
      port,
      path: '/command',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), 'x-opera-bridge-token': 'test-bridge-token' }
    }, (res) => {
      let out = '';
      res.on('data', (piece) => { out += piece; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: JSON.parse(out) }));
    });
    req.on('error', reject);
    req.end(payload);
  });
  const nextCommand = async (seen: Set<string>): Promise<FrameCommand> => {
    const until = Date.now() + 2000;
    while (Date.now() < until) {
      const hit = device.frames
        .map((f) => (f.ok && f.message.type === 'command' ? f.message.command : null))
        .find((c) => c && !seen.has(c.id));
      if (hit) {
        seen.add(hit.id);
        return hit;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error('the command never arrived');
  };

  try {
    device.push(JSON.stringify({ type: 'hello', token: 't', deviceName: 'opera' }));
    const deadline = Date.now() + 2000;
    while (!bridge.linked() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 20));

    const seen = new Set<string>();
    const answered = post({ method: 'tabs.list', params: {}, timeoutMs: 5000 });
    const first = await nextCommand(seen);
    device.push(JSON.stringify({ type: 'complete', commandId: first.id, ok: true, result: { tabs: [{ id: '7' }] } }));

    const good = await answered;
    const goodRows = good.body.result as Array<{ id: string | number }>;
    const goodFirst = goodRows[0];
    assert.ok(goodFirst);
    assert.equal(good.status, 200);
    assert.equal(good.body.ok, true);
    assert.equal(goodRows.length, 1);
    assert.equal(Number(goodFirst.id) % 10000000000, 7, 'the settled envelope crosses the door unwrapped');

    const failing = post({ method: 'tabs.list', params: {}, timeoutMs: 5000 });
    const second = await nextCommand(seen);
    device.push(JSON.stringify({
      type: 'complete',
      commandId: second.id,
      ok: false,
      error: { code: 'X', message: 'no such tab' }
    }));
    const bad = await failing;
    assert.equal(bad.body.ok, false, 'a device failure is a failure, not an empty success');
    assert.equal(bad.body.error?.message, 'no such tab');

    const malformed = await post({ params: {} });
    assert.equal(malformed.status, 400, 'a nameless command is refused');
  } finally {
    device.close();
    await bridge.close();
  }
});
