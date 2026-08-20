# Seene Mobile — Documentation

Foundation docs for the native React Native (Expo) rebuild of Seene. Written to let a new
developer or AI agent continue without re-researching the whole project. Start with
[overview.md](./overview.md).

| Doc | What it answers |
|---|---|
| [overview.md](./overview.md) | What Seene is, why this repo exists, the three-repo / one-backend picture |
| [business-logic.md](./business-logic.md) | Domain rules, invariants, state machines (binding) |
| [features.md](./features.md) | Feature-by-feature user scenarios + mobile divergences |
| [domain-model.md](./domain-model.md) | Entities, relationships, TS shapes, DTOs, enums |
| [database.md](./database.md) | **Live** Supabase schema, RLS reality, RPCs, advisors — verified |
| [tech-stack.md](./tech-stack.md) | Recommended stack, rationale, alternatives |
| [mobile-architecture.md](./mobile-architecture.md) | Layers, boundaries, data flow, rules |
| [api-layer.md](./api-layer.md) | Backend-swappable data layer; Supabase-in-RN specifics |
| [state-management.md](./state-management.md) | Server (TanStack) vs client (Zustand) vs form (RHF) |
| [design-system.md](./design-system.md) | UI kit & design-token rules and governance |
| [liquid-glass-ios.md](./liquid-glass-ios.md) | Policy & mechanics for adopting iOS 26 Liquid Glass |
| [project-structure.md](./project-structure.md) | Directory tree & file-placement rules |
| [roadmap.md](./roadmap.md) | Phased plan; **Phase 0 = the first stage** |
| [open-questions.md](./open-questions.md) | Risks, assumptions, decisions needed (Q-* IDs) |

**Source of truth:** business logic is mined from the web app (`../master.seene/docs`), then
**verified against the live Supabase DB**. Where they disagree, the DB wins (see database.md).

**Status:** foundation phase — no feature screens built yet; repo holds the stock Expo template.
Next action: Phase 0 in [roadmap.md](./roadmap.md).

## Skill specifications

Tool-agnostic blueprints for reusable AI skills live in [skills/](./skills/). They are specs, not
built skills — materialize them into `.claude/skills/` (Claude Code) or `AGENTS.md` (Codex).

| Spec | What it captures |
|---|---|
| [skills/liquid-glass-ios.md](./skills/liquid-glass-ios.md) | How to adopt iOS 26 Liquid Glass safely (native-first, guarded, tokenized) |
