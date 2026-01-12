# Managing Dependabot PRs and Workflow Errors

## What's Happening?

When you pushed the code with Dependabot enabled, it automatically:
1. Scanned all dependencies (Python, npm, GitHub Actions)
2. Found outdated packages
3. Created PRs for each update

**This is normal!** But it can be overwhelming at first.

## Quick Action Plan

### Step 1: Close ALL Dependabot PRs (For Now)

We'll start fresh once the base CI is working:

```bash
# Using GitHub CLI (if installed)
gh pr list --label "dependencies" --json number --jq '.[].number' | xargs -I {} gh pr close {}

# Or manually:
# Go to Pull Requests tab → Filter by "dependencies" label → Close all
```

**Why?**
- Dependency updates might introduce breaking changes
- We need the base CI to work first
- We can update dependencies later in a controlled way

### Step 2: Fix Common Workflow Errors

#### Error: "No such file or directory: requirements.txt"

**Fix:** The workflow is looking for `requirements.txt` but path might be wrong.

Check `.github/workflows/ci.yml` line with `pip install -r requirements.txt` should be:
```yaml
- name: Install dependencies
  working-directory: ./backend
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
```

#### Error: "Module not found" in tests

**Fix:** Virtual environment not activated or dependencies not installed.

The workflow should have:
```yaml
- name: Run pytest
  working-directory: ./backend
  run: pytest tests/ -v --cov
```

#### Error: "npm ERR! missing script: lint"

**Fix:** Frontend doesn't have all linting tools yet.

Update the CI workflow to make linting optional:
```yaml
- name: Lint frontend with ESLint
  working-directory: ./electron-app
  run: npm run lint --if-present
  continue-on-error: true
```

#### Error: "Cannot find module 'eslint'"

**Fix:** ESLint not installed yet.

```bash
cd electron-app
npm install eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier --save-dev
```

### Step 3: Fix the Workflows

The main issues are likely:
1. Missing linting dependencies
2. Paths not matching the repo structure
3. Tests expecting certain environment setup

Let's make the workflows more robust:

```bash
# Update the reduced dependabot limits
git add .github/dependabot.yml
git commit -m "ci: reduce dependabot PR limits"
git push
```

### Step 4: Test Locally First

Before pushing, always test locally:

```bash
# Backend
cd backend
source venv/bin/activate
pytest tests/ -v
flake8 . || echo "Flake8 warnings found"

# Frontend
cd electron-app
npm test -- --run
npm run lint || echo "Linting errors found"
```

## Handling Dependabot PRs (When Ready)

### Strategy: Gradual Updates

**Don't merge all at once!** Instead:

1. **Group by priority:**
   - 🔴 Security updates (merge first)
   - 🟡 Minor/patch updates (low risk)
   - 🔵 Major updates (test carefully)

2. **Merge in batches:**
   ```bash
   # Example: Merge security updates
   gh pr list --label "dependencies" --search "security" | grep "^#" | ...
   ```

3. **Test after each merge:**
   - Run tests locally
   - Check if app still works
   - Verify no breaking changes

### How to Review a Dependabot PR

1. **Check the change:**
   - Click on "Files changed"
   - See what version changed
   - Read the changelog link

2. **Check for breaking changes:**
   - Look at the dependency's GitHub releases
   - Check if it's a major version bump
   - Read migration guides if available

3. **Test locally:**
   ```bash
   gh pr checkout 123  # PR number
   cd backend && pip install -r requirements.txt
   pytest tests/ -v
   ```

4. **Merge or close:**
   - ✅ Merge if tests pass and no breaking changes
   - ❌ Close if not needed or causes issues
   - 💬 Comment if you need to investigate

## Disabling Dependabot (If Needed)

### Option 1: Pause completely

Delete or rename `.github/dependabot.yml`:
```bash
mv .github/dependabot.yml .github/dependabot.yml.disabled
git add .github/dependabot.yml.disabled
git commit -m "ci: disable dependabot temporarily"
git push
```

### Option 2: Set to manual only

Edit `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "monthly"  # Less frequent
    open-pull-requests-limit: 1  # Only 1 at a time
```

### Option 3: Security only

In GitHub repo settings:
1. Go to Settings → Security & analysis
2. Disable "Dependabot version updates"
3. Keep "Dependabot security updates" enabled

## Fixing Workflow Errors

### Debug workflow failures:

1. **Go to Actions tab**
2. **Click on the failed workflow**
3. **Click on the failed job**
4. **Expand the failed step**
5. **Read the error message**

### Common fixes:

**Python module not found:**
```yaml
# Add to workflow before running tests
- run: pip list  # See what's installed
- run: python -c "import sys; print(sys.path)"  # Check Python path
```

**npm script not found:**
```yaml
# Make script optional
- run: npm run lint --if-present
  continue-on-error: true
```

**Permission denied:**
```yaml
# Add permissions at job level
permissions:
  contents: read
  pull-requests: write
```

## Recommended Approach

For your situation right now:

1. **Close all Dependabot PRs:** Start fresh
2. **Fix the base CI workflows:** Make sure they pass on main branch
3. **Push the updated dependabot.yml:** With lower limits (already done)
4. **Test locally before every push**
5. **Re-enable Dependabot:** Once CI is stable
6. **Handle PRs gradually:** 1-3 per week

## Quick Commands

```bash
# List all open PRs
gh pr list

# Close all dependabot PRs
gh pr list --label "dependencies" --state open

# Check workflow status
gh run list --limit 5

# View workflow logs
gh run view <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

## Need Help?

If you're stuck:
1. Share the specific error message
2. Share which workflow is failing (CI, Security, etc.)
3. Share the failed step name
4. I can help debug and fix it

## Summary

**Right Now:**
- ✅ Reduced Dependabot PR limits (3 for backend/frontend, 2 for actions)
- 🔄 Close existing PRs to start fresh
- 🔧 Fix any workflow errors
- ✅ Get main branch CI passing

**Later:**
- ♻️ Re-enable Dependabot (it's already on, just limited)
- 📦 Handle dependency updates gradually
- 🔒 Prioritize security updates

This is a normal part of setting up CI/CD. We'll get it sorted! 🚀
