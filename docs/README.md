# Project Documentation

This directory holds two kinds of content:

1. **Reference documentation** — human- and AI-readable docs about this codebase, organized by category.
2. **Skill specifications** (`skills/`) — tool-agnostic blueprints that any AI agent can turn into a working skill for its own host (Claude Code, Codex, or a generic agent).

> This README is also an instruction set for AI agents. If you are an agent reading this, the sections marked **For AI** below tell you what you are allowed and expected to do.

## Layout

| Path            | What lives here                                      |
| --------------- | ---------------------------------------------------- |
| `architecture/` | Project structure, module boundaries, routing, state |
| `design/`       | Themes, CSS variables, design tokens, visual system  |
| `ui/`           | Component usage, template patterns, layout           |
| `code/`         | Composables, stores, utilities, API clients          |
| `business/`     | Domain logic, entities, rules, workflows             |
| `deploy/`       | Build, CI/CD, hosting, environments                  |
| `integrations/` | External APIs, SDKs, MCP servers                     |
| `practices/`    | Conventions, linting, testing, git workflow          |
| `skills/`       | Skill specifications (blueprints for AI skills)      |

## Reference docs

| Doc                                                      | Category     | What it covers                                                                                                                              |
| -------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [Projects Overview](./architecture/projects-overview.md) | architecture | How `seene` (B2C) and `master.seene` (B2B dashboard) split responsibility over one shared Supabase DB, and the settings integration backlog |
| [Data Model](./business/data-model.md)                   | business     | This repo's view of the shared Supabase schema                                                                                              |
| [Theme Variables](./theme-variables.md)                  | design       | CSS design tokens for the public site                                                                                                       |

## Skill specifications

Each file in `skills/` (except this index) is a **spec**: a versioned, host-neutral description of one skill — its purpose, triggers, workflow, and acceptance criteria. A spec is not a finished skill; it is the source of truth from which a real skill is built, adapted to whatever tool reads it.

### Current specs

<!-- AUTO: regenerate this table from docs/skills/*.md on every /docs run -->

| Spec                  | Version | Status | Built for |
| --------------------- | ------- | ------ | --------- |
| _No skill specs yet._ | —       | —      | —         |

## For AI: materializing a skill from a spec

When asked to build/create/update skills (e.g. "обнови скилы", "set up the skills", or during `/init`):

1. Read each spec in `skills/`.
2. Choose the adaptation section matching your host: §9.1 Claude Code, §9.2 Codex / AGENTS.md, or §9.3 Universal if your host isn't listed.
3. Build the skill in your host's native format:
   - **Claude Code** → create `.claude/skills/<slug>/SKILL.md` (project-level by default) with `name` + a `description` that encodes the spec's §2 triggers; add `scripts/`, `references/`, `assets/` from §6.
   - **Codex** → add the capability to `AGENTS.md` (or the spec's named instruction file) in Codex's instruction style.
   - **Other** → follow §9.3 Universal.
4. Verify the build against the spec's §8 Acceptance criteria.
5. Update the spec's **Materialization log** row (tool, location, built-from spec version, date) and set the spec `status` to `built`.

Always confirm with the user before creating or overwriting skill files.

## For AI: /init behavior

If `skills/` contains specs but the corresponding skills are not built for this host (no matching entry in a spec's Materialization log, or the host's target file is missing), tell the user these specs exist and offer to materialize them. Build only after confirmation.

## For AI: "update skills" behavior

For each spec, compare its `spec_version` against the version recorded in the Materialization log for your host:

- Recorded version **older** than `spec_version` → the built skill is stale; rebuild it and update the log.
- **No** recorded row for your host → not built here; offer to build it.
- Versions **match** → up to date; skip.

Report what is stale, what is current, and what is missing before changing anything.
</content>
