# CLAUDE.md

## Project Overview

**changelog-generator** (`@code-chris/changelog-generator`, v3.0.0) is a TypeScript-based tool that generates changelogs from git commit history. It parses conventional-commit-style messages, groups them by category, and renders output using Mustache templates. It operates both as a **GitHub Action** (primary use case) and as a potential CLI tool via `bin/changelog-generator`.

Repository: `https://github.com/ckotzbauer/changelog-generator`

## Tech Stack

- **Language**: TypeScript (target ES2018, CommonJS modules)
- **Runtime**: Node.js 20 (per `action.yml` `runs.using: node20`)
- **Template engine**: Mustache (`~4.2.0`) for changelog rendering
- **Git interaction**: `simple-git` (`~3.32.0`) for reading commit logs and tags
- **File operations**: `prepend-file` (`~2.0.1`) for prepending to existing changelogs
- **Versioning**: `semver` (`~7.7.0`)
- **GitHub Action SDK**: `@actions/core` (`3.0.0`) for action input/output handling
- **Bundler**: `@vercel/ncc` (`0.38.4`) for packaging the action into a single `dist/index.js`
- **Test framework**: Jest (`30.2.0`) with `ts-jest` (`29.4.6`)
- **TypeScript compiler**: `5.9.3`
- **Dependency management**: Renovate (extends `ckotzbauer/renovate-config:default` and `:monthly`)

## Project Structure

```
.
├── action.yml                  # GitHub Action definition (inputs, branding)
├── package.json                # NPM package config, scripts, dependencies
├── tsconfig.json               # TypeScript config (ES2018, CommonJS)
├── jest.json                   # Jest config (ts-jest preset)
├── renovate.json               # Renovate dependency update config
├── github.mustache             # Mustache template for GitHub-style changelogs
├── gitlab.mustache             # Mustache template for GitLab-style changelogs
├── dist/
│   └── index.js                # ncc-bundled action entrypoint (committed)
├── src/
│   ├── action.ts               # GitHub Action entrypoint (reads inputs, calls generate)
│   ├── generator.ts            # Core logic: git log parsing, grouping, template rendering
│   ├── types.ts                # TypeScript interfaces (ChangelogItem, Group, GroupedItems, Options)
│   └── __tests__/
│       └── generator.spec.ts   # Unit tests for reformatCommit and getCategoryHeadline
├── .github/
│   ├── label-commands.json     # Bot label commands config
│   └── workflows/
│       ├── main.yml            # CI: build + test on every push
│       ├── release.yml         # Release: manual workflow_dispatch, builds + publishes
│       ├── label-issues.yml    # Auto-labeling for issues/PRs
│       ├── size-label.yml      # PR size labeling
│       └── update-snyk.yml     # Weekly Snyk security monitoring
├── CHANGELOG.md                # Generated changelog (dogfooded)
├── README.md                   # Minimal readme
├── .gitignore                  # Ignores .vscode, node_modules
└── .npmignore                  # Excludes .github, src, config files from npm package
```

## Architecture & Patterns

### Core Module: `src/generator.ts`

The generator follows a pipeline pattern:

1. **Tag resolution**: Uses `simple-git` to get all tags; the latest tag serves as the "from" reference for the commit range (`tag..HEAD`).
2. **Commit parsing** (`fetchChangelogItems`): Reads git log, filters out merge commits (containing "Merge pull request", "Merge branch", or "Merge remote-tracking branch"), then parses each commit message.
3. **Commit reformatting** (`reformatCommit`): Extracts category and title from conventional commit format (`category: title`). Handles scoped categories like `build(deps)` by extracting the scope as the category. Defaults to `chore` if no colon separator is found. Categories are lowercased.
4. **Category grouping** (`getCategoryHeadline`): Maps categories to ordered groups:
   - Order 1: `feat`, `feature`, `perf` -> "Features and improvements"
   - Order 2: `fix` -> "Bug fixes"
   - Order 3: `clean`, `cleanup`, `refactor` -> "Cleanup and refactoring"
   - Order 4: `build`, `test`, `tests` -> "Build and testing"
   - Order 5: `doc`, `docs` -> "Documentation"
   - Order 6: `security` -> "Security"
   - Order 7: `deps` -> "Dependency updates"
   - Order 99: everything else -> "Common changes"
5. **Sorting**: Items within groups are sorted alphabetically by category, then by timestamp (ascending or descending per config).
6. **Rendering**: Mustache templates are loaded from the project root (`github.mustache` or `gitlab.mustache`). The rendered changelog is prepended to the target file. Optionally, a separate commit-output file is written (without version header).

### Templates

- **`github.mustache`**: Renders commit hashes as GitHub commit links when `githubHandle` is provided.
- **`gitlab.mustache`**: Simpler format without commit links.

Both templates support an optional "Notable Changes" section and group commits under category headers.

### Action Entrypoint: `src/action.ts`

Reads GitHub Action inputs via `@actions/core`, constructs an `Options` object, and delegates to `generate()`. Handles errors by calling `core.setFailed()`.

### Type Definitions: `src/types.ts`

Four interfaces:
- `ChangelogItem`: Individual parsed commit (hash, title, timestamp, category, group)
- `Group`: Category group metadata (order, header)
- `GroupedItems`: Collection of items under one group
- `Options`: Full configuration (template, ascending, releaseDate, releaseVersion, file, commitOutput, repository, notableChanges, githubHandle)

## Build & Development

### TypeScript Compilation

- Config in `tsconfig.json`: target ES2018, CommonJS modules, `esModuleInterop` enabled
- Only `src/*.ts` files are included (not subdirectories like `__tests__`)

### Bundling for GitHub Action

Uses `@vercel/ncc` to bundle `src/action.ts` into a single `dist/index.js`. The `dist/` directory is committed to the repository since GitHub Actions require it.

### npm Scripts

| Command         | Description                                      |
|-----------------|--------------------------------------------------|
| `npm run build` | Compile TypeScript via `tsc --build tsconfig.json` |
| `npm test`      | Run tests via `jest --config jest.json`          |
| `npm run package` | Bundle action with `ncc build src/action.ts -o dist` |
| `npm start`     | Run CLI via `node bin/changelog-generator`       |

## Testing

- **Framework**: Jest 30.2.0 with ts-jest 29.4.6 preset
- **Config**: `jest.json` at project root; uses `ts-jest` preset with `isolatedModules: true`
- **Test location**: `src/__tests__/generator.spec.ts`
- **Coverage**: Unit tests cover `reformatCommit` (6 tests) and `getCategoryHeadline` (6 tests) - testing commit message parsing and category-to-group mapping
- **No integration tests**: The `generate` function and git interactions are not tested

Run tests:
```bash
npm test
```

## Linting & Code Style

- **No linter configured** (no ESLint, Prettier, or similar config files present)
- **Conventions observed in source**:
  - Named exports for public functions (`export const functionName`)
  - Explicit type annotations on exported functions (e.g., `export const reformatCommit: (m: string) => { ... } = (message: string): { ... } => { ... }`)
  - Single quotes for strings
  - 4-space indentation in TypeScript source
  - 2-space indentation in JSON config files
  - Semicolons used

## CI/CD

All workflows use reusable workflows from `ckotzbauer/actions-toolkit@0.52.0`.

### Build (`main.yml`)
- **Trigger**: Every push to any branch
- **Steps**: `npm ci` -> `npm run build` -> `npm test`

### Release (`release.yml`)
- **Trigger**: Manual `workflow_dispatch` with a `version` input
- **Steps**: `npm ci` -> `npm run package` -> `npm test`
- **Artifacts**: `dist/` directory
- **Secrets**: `GITHUB_TOKEN`, `REPO_ACCESS` (PAT), `NPM_TOKEN`

### Auxiliary Workflows
- **`label-issues.yml`**: Auto-labels issues and PRs on open/comment events
- **`size-label.yml`**: Adds size labels to PRs based on diff size
- **`update-snyk.yml`**: Weekly (Monday 12:00 UTC) Snyk security scan via `snyk monitor`

## Key Commands

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Run tests
npm test

# Bundle for GitHub Action deployment
npm run package

# Run as CLI (requires bin/changelog-generator to exist)
npm start
```

## Important Conventions

- **Commit message format**: Conventional commits (`category: description`). Scoped categories like `build(deps)` are supported; the scope replaces the prefix as the category.
- **Merge commits are excluded**: Any commit message starting with "Merge pull request", "Merge branch", or "Merge remote-tracking branch" is filtered out.
- **dist/ is committed**: The bundled `dist/index.js` must be regenerated and committed when source changes, since GitHub Actions loads it directly.
- **Templates live at project root**: Mustache templates (`github.mustache`, `gitlab.mustache`) are resolved relative to `__dirname/../`, meaning they must be at the repository root.
- **Tag-based diffing**: Changelogs are generated from the latest git tag to HEAD. If no tags exist, all commits are included.
- **GitHub Action inputs**: `release-version` and `github-handle` are required; all others have defaults (template=`github`, ascending=`false`, file=`CHANGELOG.md`).
- **No bin/ directory exists**: Despite `package.json` declaring `bin.changelog-generator: "bin/changelog-generator"`, no `bin/` directory is present in the repository.
