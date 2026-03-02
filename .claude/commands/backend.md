# Backend Task Delegation

Delegate this task to the **backend-specialist** agent.

## Task
$ARGUMENTS

## Agent Instructions

Use the `backend-specialist` agent with this prompt:

---

**Task:** $ARGUMENTS

**Before starting:**
1. Read `/root/agents/CLAUDE.md` for project conventions
2. Read `/root/agents/Architecture/00-QUICK-START.md` for system overview
3. Check `/root/agents/Plans/` for any relevant existing plans
4. Explore the relevant hooks, services, and Supabase integrations
5. Ask clarifying questions if needed

**Important:**
- Use TanStack Query patterns for data fetching
- Follow existing service patterns in `src/services/`
- Consider RLS policies for any database changes
- Update any relevant plan files with progress

---

Launch the backend-specialist agent with the above context.
