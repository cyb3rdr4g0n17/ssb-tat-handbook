# Graph Report - ssb_study  (2026-09-22)

## Corpus Check
- 11 files · ~410,091 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 124 nodes · 193 edges · 10 communities (5 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86f4a870`
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

## God Nodes (most connected - your core abstractions)
1. `KnowledgeGraph` - 24 edges
2. `TATSimulator` - 17 edges
3. `ProfessionExplorer` - 16 edges
4. `AppController` - 15 edges
5. `SituationBank` - 8 edges
6. `🎖️ SSB / TAT Master Career & Profession Reference Suite` - 8 edges
7. `keywords` - 7 edges
8. `✨ Key Features & Architecture` - 7 edges
9. `scripts` - 2 edges
10. `📖 The Problem Solved` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 5 thin omitted)

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
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `name`, `version`, `description` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `🎖️ SSB / TAT Master Career & Profession Reference Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._