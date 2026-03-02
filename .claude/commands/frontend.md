# Frontend Task Delegation

Delegate this task to the **frontend-specialist** agent.

## Task
$ARGUMENTS

## Agent Instructions

Use the `frontend-specialist` agent with this prompt:

---

**Task:** $ARGUMENTS

**Before starting:**
1. Read `/root/agents/CLAUDE.md` for project conventions
2. Read `/root/agents/Architecture/00-QUICK-START.md` for system overview
3. Check `/root/agents/Plans/` for any relevant existing plans
4. Explore the relevant React components and understand existing patterns
5. Ask clarifying questions if needed

**Important:**
- Use `@/` imports, never relative paths
- No `variant="outline"` on Buttons (use secondary or ghost)
- Follow existing component patterns
- Update any relevant plan files with progress

---

Launch the frontend-specialist agent with the above context.
