# 🤝 GitHub Collaboration Guide

## 🚀 Getting Started with Stand Up Sydney Development

### Prerequisites
- Git installed on your local machine
- Node.js 18+ installed
- A GitHub account
- Access to the repository (ask the project owner to add you as a collaborator)

## 📥 Initial Setup

### Step 1: Clone the Repository
```bash
git clone git@github.com:chillz-id/gigpig-stage-connect.git
cd gigpig-stage-connect
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with actual values (get from project owner)
# You'll need at minimum:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### Step 4: Verify Setup
```bash
# Run the mandatory startup verification
./startup-verification.sh

# Start development server
npm run dev

# Open http://localhost:8080 in your browser
```

### Step 5: Run Tests
```bash
# Ensure everything works
npm run test
npm run lint
```

## 🔄 Development Workflow

### Daily Workflow:
1. **Pull latest changes**:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit frequently**:
   ```bash
   git add .
   git commit -m "Clear, descriptive commit message"
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Then create Pull Request on GitHub
   ```

### Branch Structure:
- **`main`**: Production-ready code
- **`dev`**: Development branch (base for new features)
- **`feature/*`**: Your feature branches
- **`hotfix/*`**: Emergency fixes

## 🛠️ Development Commands

```bash
# Development
npm run dev                     # Start dev server (port 8080)
npm run build                   # Production build
npm run preview                 # Preview production build

# Testing
npm run test                    # Run all tests
npm run test:watch             # Watch mode for development
npm run test:coverage          # Coverage report

# Quality Checks
npm run lint                    # ESLint
npm run typecheck             # TypeScript checks

# Mandatory Checks (run before committing)
./startup-verification.sh       # Verify system state
./check-protocol-compliance.sh  # Check compliance
```

## 📋 Before You Start Coding

### MANDATORY: Read These Files
1. **DEVELOPER_ONBOARDING_GUIDE.md** - Complete project overview
2. **MANDATORY_STARTUP_CHECKLIST.md** - Critical protocols
3. **MCP_TOOLS_DEFINITIVE_GUIDE.md** - Database integration guide
4. **VERIFIED_DATABASE_SCHEMA.md** - Actual database structure

### Key Rules:
- ✅ **Always run `./startup-verification.sh`** before starting work
- ✅ **Never assume database schema** - verify with actual queries
- ✅ **Use feature branches** for all changes
- ✅ **Write tests** for new features
- ✅ **Follow existing code patterns**

## 🎯 Your First Task

### Recommended Starting Points:
1. **Explore the codebase**:
   ```bash
   # Check the main components
   ls src/components/
   
   # Look at existing hooks
   ls src/hooks/
   
   # Review the current pages
   ls src/pages/
   ```

2. **Run the application locally** and explore the UI

3. **Check current priority**: Settlement system for manual ticket platform entry

4. **Review existing tests**:
   ```bash
   npm run test
   # Check tests/ directory for examples
   ```

## 🔧 Working with the Database

### Using MCP Tools (Recommended):
The project uses MCP (Model Context Protocol) for database operations:

```javascript
// Example: Query data
import { list_tables, execute_sql } from './mcp-tools';

// List all tables
const tables = await list_tables();

// Execute custom query
const results = await execute_sql(`
  SELECT * FROM events WHERE date > NOW()
`);
```

### Key Database Tables:
- `profiles` - User profiles (NO role column - use user_roles table)
- `events` - Comedy events with full management
- `applications` - Comedian applications to events
- `user_roles` - Role assignments (comedian, promoter, admin)
- `ticket_sales` - Integrated ticket sales data

## 🚨 Critical Guidelines

### What NOT to Do:
- ❌ **Don't commit directly to `main` or `dev`**
- ❌ **Don't skip the startup verification**
- ❌ **Don't assume database structure**
- ❌ **Don't commit `.env` files**
- ❌ **Don't create duplicate functionality**

### What TO Do:
- ✅ **Use feature branches**
- ✅ **Write descriptive commit messages**
- ✅ **Add tests for new features**
- ✅ **Follow TypeScript strictly**
- ✅ **Ask questions if unsure**

## 🧪 Testing Strategy

### Test Types:
```bash
# Unit tests (components, hooks)
npm run test -- tests/components/

# Integration tests (API calls)
npm run test -- tests/integration/

# E2E tests (full workflows)
npm run test -- tests/e2e/
```

### Writing Tests:
- Use Jest + React Testing Library
- Follow existing test patterns
- Test user interactions, not implementation details
- Aim for meaningful coverage, not 100%

## 🎁 Helpful Resources

### Project Documentation:
- **Architecture**: See DEVELOPER_ONBOARDING_GUIDE.md
- **Database Schema**: VERIFIED_DATABASE_SCHEMA.md
- **MCP Integration**: MCP_TOOLS_DEFINITIVE_GUIDE.md

### External Resources:
- **React Query**: Used for API state management
- **Tailwind CSS**: Styling system
- **shadcn/ui**: Component library
- **Supabase**: Backend and database
- **TypeScript**: Type system

## 🆘 Getting Help

### When You're Stuck:
1. **Check the Knowledge Graph**: 
   ```bash
   node /root/.claude-multi-agent/scripts/claude-graph-integration.js find "your issue"
   ```

2. **Review similar code**: Look for similar components/features

3. **Run tests**: They often show expected behavior

4. **Ask questions**: Better to ask than break something!

### Common Issues:
- **Environment variables**: Check .env file matches .env.example
- **Database errors**: Verify schema with VERIFIED_DATABASE_SCHEMA.md
- **Import errors**: Check tsconfig.json path mappings
- **Type errors**: Run `npm run typecheck`

## 📝 Pull Request Guidelines

### Creating Good PRs:
1. **Clear title**: Describe what the PR does
2. **Description**: Why the change is needed
3. **Screenshots**: For UI changes
4. **Tests**: Include relevant tests
5. **Small scope**: One feature per PR when possible

### PR Checklist:
- [ ] Tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript checks pass (`npm run typecheck`)
- [ ] Startup verification passes (`./startup-verification.sh`)
- [ ] No `.env` or sensitive files committed
- [ ] Feature works locally
- [ ] Documentation updated if needed

## 🎯 Current Priority: Settlement System

The main current task is implementing a settlement system that allows:
- Manual entry of ticket sales from platforms like Groupon, Promotix, etc.
- Flexible platform naming (any custom platform name)
- Attendance tracking for events
- Invoice generation and comedian payouts

Check the existing ticket sales components in `src/components/admin/ticket-sales/` for patterns to follow.

---

**Welcome to the team!** This system has sophisticated safeguards to prevent development disasters. Follow the protocols, and you'll have a great development experience. 🚀