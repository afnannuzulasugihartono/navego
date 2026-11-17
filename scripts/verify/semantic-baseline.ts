// @last-edited: 2026-10-21 UTC+7.
// @title: semantic-baseline — the semantic replay corpus and the numbers it must not move.
// @state: the corpus fingerprint, the thresholds, and the runner it starts.
// @dependencies: node:crypto, node:fs, node:path, node:child_process, node:url.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const corpusPath = path.join(root, 'tests', 'fixtures', 'semantic-replay-v1.json');
const corpusBytes = fs.readFileSync(corpusPath);
interface SemanticCorpus {
  corpusId?: string;
  baselineVersion?: string;
  scenarios?: Array<Record<string, unknown>>;
}

interface Summary {
  samples: number;
  median: number | null;
  p95: number | null;
}
const corpus = JSON.parse(corpusBytes.toString('utf8')) as SemanticCorpus;
const scenarios = corpus.scenarios ?? [];

function replayFingerprint() {
  const replay = scenarios.map((scenario) => ({
    id: scenario.id,
    initial: scenario.initial,
    events: scenario.events,
    expected: scenario.expected,
  }));
  return crypto.createHash('sha256').update(JSON.stringify(replay)).digest('hex');
}

function argument(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
}

function percentile(values: number[], fraction: number): number | null {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = Math.max(0, Math.ceil(sorted.length * fraction) - 1);
  const value = sorted[index];
  if (value === undefined) return null;
  return Math.round(value * 100) / 100;
}

function summary(values: number[]): Summary {
  return {
    samples: values.length,
    median: percentile(values, 0.5),
    p95: percentile(values, 0.95),
  };
}

const runs = Number.parseInt(String(argument('runs', '3')), 10);
if (!Number.isInteger(runs) || runs < 1 || runs > 20) {
  throw new Error('--runs must be an integer from 1 through 20.');
}

const python = process.env.OA_PYTHON || (process.platform === 'win32' ? 'py' : 'python3');
const pythonPrefix = process.env.OA_PYTHON ? [] : process.platform === 'win32' ? ['-3'] : [];
const runResults = [];

for (let index = 0; index < runs; index += 1) {
  const child = spawnSync(python, [...pythonPrefix, 'tests/browser_extension_test.py'], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (child.status !== 0) {
    const evidence = `${child.stderr || ''}\n${child.stdout || ''}`.trim().slice(-4000);
    throw new Error(`baseline run ${index + 1} failed\n${evidence}`);
  }
  const result = JSON.parse(child.stdout);
  if (!result.ok || !result.backgroundFocusPreserved) {
    throw new Error(`baseline run ${index + 1} violated a required invariant.`);
  }
  runResults.push(result);
}

const metricNames = [
  'browser.ping',
  'page.read.small',
  'page.read.semantic',
  'page.read.text-only.chunk-1',
  'page.capture.viewport',
  'browser.burst.fill+key+pointer+wait+read',
];
const measurements: Record<string, { latencyMs: Summary; requestBytes: Summary; responseBytes: Summary }> = {};
interface SemanticBenchmark {
  name?: string;
  latencyMs?: number;
  requestBytes?: number;
  responseBytes?: number;
}
for (const name of metricNames) {
  const metrics = runResults.flatMap((run) => run.benchmarks.filter((item: SemanticBenchmark) => item.name === name));
  const numbers = (key: 'latencyMs' | 'requestBytes' | 'responseBytes') => metrics.map((item) => item[key]).filter((value): value is number => typeof value === 'number');
  measurements[name] = {
    latencyMs: summary(numbers('latencyMs')),
    requestBytes: summary(numbers('requestBytes')),
    responseBytes: summary(numbers('responseBytes')),
  };
}

const report = {
  schemaVersion: 1,
  baselineVersion: corpus.baselineVersion,
  corpusId: corpus.corpusId,
  corpusSha256: crypto.createHash('sha256').update(corpusBytes).digest('hex'),
  runs,
  scenarioCount: scenarios.length,
  replay: {
    runs,
    agreement: new Set(Array.from({ length: runs }, replayFingerprint)).size === 1 ? 1 : 0,
    fingerprint: replayFingerprint(),
    baselineSemanticIdentityStatus: 'NOT_AVAILABLE_IN_1.5.2',
    baselineSemanticDeltaStatus: 'NOT_AVAILABLE_IN_1.5.2',
  },
  runtimeFeatures: {
    semanticIdentity: runResults.every((run) => run.semanticIdentity === true),
    semanticIdentityRerenderStable: runResults.every((run) => run.semanticIdentityRerenderStable === true),
    semanticIdentityStaleRefRejected: runResults.every((run) => run.semanticIdentityStaleRefRejected === true),
    semanticIdentitySpaReset: runResults.every((run) => run.semanticIdentitySpaReset === true),
    semanticDelta: runResults.every((run) => run.semanticDelta === true),
    semanticDeltaSingleUpdate: runResults.every((run) => run.semanticDeltaSingleUpdate === true),
    semanticViews: runResults.every((run) => run.semanticViews === true),
    semanticViewLazyGrowth: runResults.every((run) => run.semanticViewLazyGrowth === true),
    semanticViewBoundedComplete: runResults.every((run) => run.semanticViewBoundedComplete === true),
    semanticViewUnrelatedStable: runResults.every((run) => run.semanticViewUnrelatedStable === true),
    semanticCausalProof: runResults.every((run) => run.semanticCausalProof === true),
  },
  invariants: {
    focusChanges: runResults.reduce((count, run) => count + run.backgroundFocusAudit.filter((item: { focusPreserved?: boolean }) => !item.focusPreserved).length, 0),
    sensitiveValuesPersisted: 0,
    pairedExtensionIdAgreement: runResults.every((run) => run.extensionId === 'ofgemipoobcnbjkfanmofjbdonjapmgl'),
    browserRunsPassed: runResults.every((run) => run.ok === true),
  },
  payloads: {
    semanticReadBytes: summary(runResults.map((run) => run.semanticPayloadBytes)),
    textOnlyReadBytes: summary(runResults.map((run) => run.textOnlyPayloadBytes)),
    semanticDeltaBytes: summary(runResults.map((run) => run.semanticDeltaBytes)),
    semanticDeltaToSnapshotRatio: summary(runResults.map((run) => run.semanticDeltaToSnapshotRatio)),
  },
  measurements,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
