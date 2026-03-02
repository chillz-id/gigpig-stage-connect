# N8N Task Delegation

Delegate this task to the **n8n-expert** agent.

## Task
$ARGUMENTS

## Agent Instructions

Use the `n8n-expert` agent with this prompt:

---

**Task:** $ARGUMENTS

**Before starting:**
1. Read `/root/agents/CLAUDE.md` for project context
2. Check existing N8N workflows in `/root/n8n-workflows/`
3. **Look up current documentation:**
   - Use `mcp__n8n-mcp__search_nodes` to find available nodes
   - Use `mcp__n8n-mcp__get_node` to get node schemas and properties
   - Use `mcp__context7__get-library-docs` for n8n documentation
   - Use `mcp__n8n-mcp__search_templates` for example workflows
4. Understand the Supabase schema relevant to this workflow
5. Ask clarifying questions if needed

**Important:**
- Always fetch node documentation before configuring
- Validate node configs with `validate_node` before building
- Test workflows before deploying
- Document webhook endpoints and triggers
- Consider error handling and retries
- Update any relevant plan files with progress

---

Launch the n8n-expert agent with the above context.
