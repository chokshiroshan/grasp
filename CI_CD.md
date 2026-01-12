# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for the Grasp project.

## Overview

The Grasp project uses **GitHub Actions** for CI/CD automation with the following workflows:

1. **CI Workflow** - Automated testing and building
2. **Release Workflow** - Automated releases for tagged versions
3. **Security Workflow** - Security scanning and dependency auditing
4. **Dependabot** - Automated dependency updates

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** Push and Pull Requests to `main` and `develop` branches

**Jobs:**

#### Backend Tests
- Runs on: Ubuntu Latest
- Python versions: 3.11, 3.12 (matrix)
- Steps:
  1. Checkout code
  2. Set up Python with pip caching
  3. Install backend dependencies
  4. Run pytest with coverage
  5. Upload coverage to Codecov

#### Frontend Tests
- Runs on: Ubuntu Latest
- Node.js version: 20
- Steps:
  1. Checkout code
  2. Set up Node.js with npm caching
  3. Install frontend dependencies
  4. Run Vitest tests with coverage
  5. Upload coverage to Codecov

#### Lint
- Runs on: Ubuntu Latest
- Steps:
  1. Lint backend with flake8
  2. Check backend formatting with black
  3. Lint frontend with ESLint

#### Build
- Runs on: Ubuntu, macOS, Windows (matrix)
- Depends on: Backend and Frontend tests passing
- Steps:
  1. Build Electron app for each platform
  2. Upload build artifacts (retained for 7 days)

### 2. Release Workflow (`.github/workflows/release.yml`)

**Trigger:** Push tags matching `v*.*.*` (e.g., v1.0.0)

**Jobs:**

#### Create Release
- Creates a GitHub release from the tag
- Generates release notes from CHANGELOG.md

#### Build and Upload
- Builds Electron app for macOS, Linux, Windows
- Uploads platform-specific installers to the release:
  - `Grasp-vX.X.X-mac.dmg`
  - `Grasp-vX.X.X-linux.AppImage`
  - `Grasp-vX.X.X-win.exe`

### 3. Security Workflow (`.github/workflows/security.yml`)

**Trigger:**
- Weekly on Mondays at 9 AM UTC
- Push/PR to `main` branch

**Jobs:**

#### Backend Security
- Safety check for vulnerable Python dependencies
- Bandit security linter for code vulnerabilities
- Uploads security reports as artifacts

#### Frontend Security
- npm audit for vulnerable packages
- Lists outdated dependencies

#### CodeQL Analysis
- Static code analysis for Python and JavaScript
- Detects security vulnerabilities and coding errors
- Results appear in GitHub Security tab

### 4. Dependabot (`.github/dependabot.yml`)

**Automatic Dependency Updates:**

- **Python (backend)**: Weekly on Monday
- **npm (frontend)**: Weekly on Monday
- **GitHub Actions**: Weekly on Monday

**Features:**
- Auto-creates PRs for dependency updates
- Labels PRs appropriately (dependencies, backend, frontend)
- Limits open PRs to prevent spam
- Uses semantic commit messages

## Setup Instructions

### 1. Initial Repository Setup

```bash
# Initialize git repository (if not already)
cd /Users/roshanchokshi/Documents/Grasp
git init
git add .
git commit -m "Initial commit with CI/CD setup"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/grasp.git
git branch -M main
git push -u origin main
```

### 2. GitHub Repository Settings

#### Enable GitHub Actions
1. Go to repository Settings → Actions → General
2. Set "Actions permissions" to "Allow all actions and reusable workflows"
3. Save changes

#### Enable Dependabot
1. Go to Settings → Security & analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"
4. Enable "Dependabot version updates"

#### Branch Protection (Optional but Recommended)
1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - Select: `Backend Tests`, `Frontend Tests`, `Lint`
   - ✅ Require branches to be up to date before merging

### 3. Secrets Configuration

#### Codecov (Optional - for coverage tracking)
1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get the upload token
4. Add to GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov token

## Running Workflows

### Automatic Triggers

**Every Push/PR to `main` or `develop`:**
- ✅ Backend tests run
- ✅ Frontend tests run
- ✅ Linting checks
- ✅ Build validation

**Weekly (Mondays):**
- 🔒 Security scans
- 📦 Dependency updates

**On Tagged Release (e.g., `v1.0.0`):**
- 🚀 Build and publish installers

### Manual Workflow Runs

You can manually trigger workflows from GitHub:

1. Go to Actions tab
2. Select workflow
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow"

## Creating a Release

### Semantic Versioning

Use [Semantic Versioning](https://semver.org/):
- **MAJOR** (v2.0.0): Breaking changes
- **MINOR** (v1.1.0): New features, backwards compatible
- **PATCH** (v1.0.1): Bug fixes, backwards compatible

### Release Process

```bash
# 1. Update CHANGELOG.md with new version changes
vim CHANGELOG.md

# 2. Update version in package.json
cd electron-app
npm version 1.0.0 --no-git-tag-version
cd ..

# 3. Commit changes
git add .
git commit -m "chore: bump version to 1.0.0"
git push

# 4. Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 5. GitHub Actions will automatically:
#    - Create GitHub release
#    - Build installers for all platforms
#    - Upload installers to release
```

### Pre-release

For beta/alpha versions:

```bash
git tag -a v1.0.0-beta.1 -m "Beta release v1.0.0-beta.1"
git push origin v1.0.0-beta.1
```

## Local Development

### Running Checks Locally

**Backend:**
```bash
cd backend
source venv/bin/activate

# Tests
pytest tests/ -v

# Linting
flake8 .
black --check .
isort --check .

# Security
bandit -r .
safety check
```

**Frontend:**
```bash
cd electron-app

# Tests
npm test -- --run

# Linting
npm run lint
npm run type-check

# Formatting
npm run format

# Security
npm audit
```

### Pre-commit Checks

Consider installing pre-commit hooks:

```bash
# Install pre-commit
pip install pre-commit

# Create .pre-commit-config.yaml (optional)
# Then run:
pre-commit install
```

## Badges

Add these badges to your README.md to show build status:

```markdown
[![CI](https://github.com/YOUR_USERNAME/grasp/workflows/CI/badge.svg)](https://github.com/YOUR_USERNAME/grasp/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_USERNAME/grasp/workflows/Security%20Scan/badge.svg)](https://github.com/YOUR_USERNAME/grasp/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/grasp/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/grasp)
```

## Troubleshooting

### Workflow Failures

**Backend Tests Fail:**
- Check Python version compatibility
- Verify all dependencies are in requirements.txt
- Check DATABASE_PATH and test database setup

**Frontend Tests Fail:**
- Verify Node.js version (should be 20)
- Check for missing dependencies
- Ensure vitest.config.ts is correct

**Build Fails:**
- Check electron-vite configuration
- Verify all source files are included
- Check platform-specific issues in logs

### Common Issues

1. **"No such file or directory" errors**
   - Ensure working directories are correct in workflow
   - Check file paths are relative to repository root

2. **Dependency installation failures**
   - Clear npm/pip cache
   - Update package-lock.json / requirements.txt
   - Check for version conflicts

3. **Permission denied errors**
   - Check GITHUB_TOKEN permissions
   - Verify repository settings allow Actions

## Cost and Usage

### GitHub Actions

**Free tier includes:**
- 2,000 minutes/month for private repos
- Unlimited for public repos

**Current workflow usage per run:**
- CI: ~10-15 minutes
- Security: ~5-10 minutes
- Release: ~20-30 minutes

**Monthly estimate:** ~500 minutes (well within free tier)

### Optimization Tips

- Use caching for dependencies (already configured)
- Skip redundant jobs with path filters
- Use matrix strategies efficiently
- Cancel redundant workflow runs

## Future Enhancements

Potential improvements to consider:

1. **E2E Testing**: Add Playwright/Cypress for end-to-end tests
2. **Performance Testing**: Add lighthouse CI for performance monitoring
3. **Docker**: Containerize backend for consistent environments
4. **Auto-deploy**: Deploy to cloud platforms on release
5. **Changelog Generator**: Auto-generate changelog from commits
6. **Version Bumping**: Automate version bumping based on commits

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
