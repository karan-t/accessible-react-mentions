# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets). When you make a user-visible change to any package, run `pnpm changeset` and follow the prompts. The CLI will create a Markdown file here describing the change and the version bump.

On merge to `main`, the GitHub Action opens (or updates) a "Version Packages" PR. Merging that PR publishes the new versions to npm.
