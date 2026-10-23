# Skill specifications

Tool-agnostic **blueprints** for reusable AI skills. Each spec describes intent, triggers, workflow,
and acceptance criteria precisely enough that any agentic tool (Claude Code skill-creator, Codex, a
generic LLM agent) can materialize it into a real skill adapted to its own host. The spec is the
source of truth; a built skill is downstream of it.

To turn a spec into a working skill, either ask here ("build the skills" / "обнови скилы") or point
another tool at the spec file. Default Claude Code skills to project-level `.claude/skills/`.

| Spec | Version | Status | Built for |
|---|---|---|---|
| [liquid-glass-ios.md](./liquid-glass-ios.md) | 1.0 | built | claude-code (`.claude/skills/liquid-glass-ios/`) |
