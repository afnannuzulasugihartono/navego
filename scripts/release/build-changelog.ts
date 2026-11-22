#!/usr/bin/env node

// @last-edited: 2026-11-22 UTC+7.
// @title: build-changelog - the site's release list is generated from the release notes.
// @state: reads docs/releases/<version>.md, sorts by semver, and writes site/app/data/releases.json.
// @dependencies: node:fs, node:path, node:url.

// THE SITE READS THE SAME NOTES THE REPOSITORY KEEPS.
// The changelog page used to carry a hand-written copy of the release list, so it stopped at 1.7.6 while the product shipped 1.8.1.
// This generator makes the page a view of docs/releases: one source, one generator, and a diff that shows every change.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  points: string[];
}

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VERSION_FILE = /^(\d+\.\d+\.\d+)\.md$/;

export function compareVersions(left: string, right: string): number {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function metadata(text: string, name: string, field: string): string {
  const match = text.match(new RegExp(`^#\\s+@${field}:\\s*(.+)$`, 'm'));
  if (!match?.[1]) throw new Error(`${name}: no @${field} line`);
  return match[1].trim();
}

function releaseTitle(text: string, version: string): string {
  const raw = metadata(text, `${version}.md`, 'title');
  const title = stripMarkdown(raw.replace(new RegExp(`^${version.replace(/\./g, '\\.')}\\s*(?:[-—–:])+\\s*`), '').trim());
  return title || stripMarkdown(raw);
}

function releaseDate(text: string, version: string, changelog: string): string {
  const edited = text.match(/^#\s+@last-edited:\s*(\d{4}-\d{2}-\d{2})/m);
  if (edited?.[1]) return edited[1];
  const row = changelog.match(new RegExp(`^\\|\\s*${version.replace(/\./g, '\\.')}\\s*\\|\\s*(\\d{4}-\\d{2}-\\d{2})\\s*\\|`, 'm'));
  if (row?.[1]) return row[1];
  throw new Error(`${version}.md: no @last-edited date, and CHANGELOG.md carries no date for it`);
}

function surfacePoints(text: string): string[] {
  const heading = text.match(/^#{1,6}\s+(?:WHAT REACHED\b[^\n]*|\d+\.\d+\.\d+\s*[-—–][^\n]*)\s*$/m);
  if (!heading || heading.index === undefined) return [];
  const afterHeading = text.slice(heading.index + heading[0].length);
  const nextHeading = afterHeading.search(/^#{1,6}\s+/m);
  const section = nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
  const bullets: string[] = [];
  let current: string[] | null = null;
  for (const line of section.split('\n')) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (current) bullets.push(current.join(' '));
      current = [bullet[1] ?? ''];
      if (bullets.length === 3) break;
      continue;
    }
    if (!current) continue;
    if (!line.trim()) {
      bullets.push(current.join(' '));
      current = null;
      if (bullets.length === 3) break;
      continue;
    }
    if (/^\s{2,}\S/.test(line)) {
      current.push(line.trim());
      continue;
    }
    bullets.push(current.join(' '));
    current = null;
    if (bullets.length === 3) break;
  }
  if (current && bullets.length < 3) bullets.push(current.join(' '));
  return bullets.map(stripMarkdown).filter(Boolean).slice(0, 3);
}

export function buildReleases(root = repo, overrides = new Map<string, string>()): ReleaseEntry[] {
  const releasesDir = path.join(root, 'docs/releases');
  const changelogPath = path.join(root, 'CHANGELOG.md');
  const read = (file: string): string => overrides.get(file) ?? fs.readFileSync(file, 'utf8');
  const changelog = read(changelogPath);
  const files = new Set(fs.readdirSync(releasesDir));
  for (const file of overrides.keys()) {
    const relative = path.relative(releasesDir, file);
    if (!relative.startsWith('..') && !relative.includes(path.sep) && VERSION_FILE.test(relative)) files.add(relative);
  }
  const entries: ReleaseEntry[] = [];
  for (const file of files) {
    const match = file.match(VERSION_FILE);
    if (!match?.[1]) continue;
    const version = match[1];
    const text = read(path.join(releasesDir, file));
    entries.push({
      version,
      date: releaseDate(text, version, changelog),
      title: releaseTitle(text, version),
      points: surfacePoints(text),
    });
  }
  return entries.sort((left, right) => compareVersions(right.version, left.version));
}

export function buildReleasesJson(root = repo, overrides = new Map<string, string>()): string {
  return `${JSON.stringify({ entries: buildReleases(root, overrides) }, null, 2)}\n`;
}

const invokedDirectly = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (invokedDirectly) {
  const target = path.join(repo, 'site/app/data/releases.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buildReleasesJson(), 'utf8');
  console.log(`build-changelog: wrote ${target}`);
}
