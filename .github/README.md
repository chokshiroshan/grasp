# GitHub Actions Workflows

This directory contains all CI/CD automation workflows for Grasp.

## Quick Reference

### Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **CI** | `ci.yml` | Push/PR to main, develop | Run tests, lint, build |
| **Release** | `release.yml` | Push tag `v*.*.*` | Create releases, build installers |
| **Security** | `security.yml` | Weekly, Push to main | Security scanning |
| **Dependabot** | `../dependabot.yml` | Weekly | Dependency updates |

### Status Checks

All PRs must pass:
- ✅ Backend Tests (Python 3.11, 3.12)
- ✅ Frontend Tests (Node 20)
- ✅ Linting (flake8, ESLint)
- ✅ Build (Ubuntu, macOS, Windows)

### Creating a Release

```bash
# 1. Update CHANGELOG.md
# 2. Commit changes
git add .
git commit -m "chore: release v1.0.0"
git push

# 3. Tag and push
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 4. Wait for workflows to complete
# Installers will be attached to GitHub release
```

### Manual Workflow Run

1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Choose branch and run

### Viewing Results

- **Actions Tab**: See all workflow runs
- **Security Tab**: CodeQL analysis results
- **Pull Requests**: See status checks on PRs
- **Releases**: Download built installers

## Configuration Files

```
.github/
├── workflows/
│   ├── ci.yml          # Main CI pipeline
│   ├── release.yml     # Release automation
│   └── security.yml    # Security scanning
└── dependabot.yml      # Dependency updates

backend/
├── .flake8            # Python linting config
├── pyproject.toml     # Black, isort, pytest config
└── requirements-dev.txt

electron-app/
├── .eslintrc.json     # ESLint config
├── .prettierrc        # Prettier config
└── package.json       # npm scripts
```

## Local Testing

Before pushing, test locally:

```bash
# Backend
cd backend
pytest tests/ -v
flake8 .
black --check .

# Frontend
cd electron-app
npm test -- --run
npm run lint
npm run type-check
```

## Resources

- [Full CI/CD Documentation](../CI_CD.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Dependabot Docs](https://docs.github.com/en/code-security/dependabot)
