# Graph Report - ssb_study  (2026-10-03)

## Corpus Check
- 13 files · ~563,554 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 152 nodes · 259 edges · 12 communities (6 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3b935557`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- KnowledgeGraph
- TATSimulator
- ProfessionExplorer
- AppController
- 🎖️ SSB / TAT Master Career & Profession Reference Suite
- package.json
- SituationBank
- vercel.json
- IntelLibrary

## God Nodes (most connected - your core abstractions)
1. `TATSimulator` - 36 edges
2. `KnowledgeGraph` - 24 edges
3. `ProfessionExplorer` - 16 edges
4. `AppController` - 15 edges
5. `SituationBank` - 8 edges
6. `🎖️ SSB / TAT Master Career & Profession Reference Suite` - 8 edges
7. `IntelLibrary` - 7 edges
8. `keywords` - 7 edges
9. `✨ Key Features & Architecture` - 7 edges
10. `scripts` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 6 thin omitted)

### Community 4 - "🎖️ SSB / TAT Master Career & Profession Reference Suite"
Cohesion: 0.12
Nodes (15): 1. 🌟 The 7-Step Core Action Logic Engine, 2. 🕸️ Interactive Logic Knowledge Graph, 3. 🔍 459 Professions Matrix & Live Explorer, 459 Professions across 25 Domains · 7-Step Practical Action Engine · Interactive Knowledge Graph & Timed Simulator, 4. 🚨 25-Scenario TAT Situation Bank & Story Intelligence Dossier, 5. ⏱️ Timed TAT Practice Simulator & Rubric Radar, 6. ☀️/🌙 Dual Theme Engine, 🤝 Contributing (+7 more)

### Community 5 - "package.json"
Cohesion: 0.13
Nodes (14): author, description, keywords, license, name, scripts, start, version (+6 more)

### Community 7 - "vercel.json"
Cohesion: 0.40
Nodes (4): cleanUrls, headers, name, version

## Knowledge Gaps
- **28 isolated node(s):** `name`, `version`, `description`, `start`, `ssb` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TATSimulator` be split into smaller, more focused modules?**
  _Cohesion score 0.13213213213213212 - nodes in this community are weakly interconnected._
- **Should `🎖️ SSB / TAT Master Career & Profession Reference Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._