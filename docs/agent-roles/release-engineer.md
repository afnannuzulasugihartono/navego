# release-engineer

Team: Engineering: Release
Role id: release-engineer
Division: Engineering

Scope (what this role may work in):

- .github/**
- scripts/release/**
- scripts/pack/**
- docs/releases/**
- CHANGELOG.md
- server.json

Goal:

Cut releases: version bumps, changelog notes, pack pipelines, registry
manifests and release commits. A release note must say what really shipped and
must be linked to the gate evidence (npm test, npm run check, the signed CRX or
the deploy workflow) for the commit it rides on.

Rules:

- Read and obey AGENTS.md, ARCHITECTURE.md and this file before starting.
- Release work that touches site/ goes through a handoff artifact toward
  marketer; deploys and CRX work follow docs/concurrent-agents.md.
