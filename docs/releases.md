# Releases and versioning

Bizallele uses Semantic Versioning for the `bizallele` package. This document
defines the release discipline being established during the repository’s
portfolio rehabilitation; it does not claim that automated publication is
configured today.

## Version policy

- **Patch** releases contain backward-compatible fixes and documentation
  corrections with no new required consumer behavior.
- **Minor** releases add backward-compatible APIs or capabilities.
- **Major** releases may remove or change public APIs, runtime behavior, or
  TypeScript contracts in ways that require consumer migration.

The public contract includes JavaScript runtime exports, TypeScript declarations,
builder modifiers, validation and lifecycle behavior, and documented integration
contracts. A behavior change is not “internal” merely because the function name
is unchanged.

## Changelog discipline

Every user-visible change starts in the `Unreleased` section of
[`CHANGELOG.md`](../CHANGELOG.md), under Added, Changed, Deprecated, Removed,
Fixed, or Security. Keep entries focused on consumer impact rather than commit
mechanics.

When preparing a verified release:

1. choose the SemVer increment from the compatibility impact;
2. replace `Unreleased` changes with a dated version heading;
3. update the package version and lockfile together;
4. link the version heading to the exact tag comparison; and
5. create a new empty `Unreleased` section.

Do not backfill historical versions from the manifest alone. A package version,
Git tag, and registry publication are different evidence and should be described
separately when they cannot all be verified.

## Release checklist

- Confirm the working tree is clean and the intended commit is on the release
  branch.
- Review runtime exports, `src/index.d.ts`, and files under `src/types/` for alignment.
- Update focused tests, public documentation, examples, ADR inventories, and
  migration guidance for every affected API.
- Run `npm ci`, `npm test`, and `npm run typecheck` from the repository root.
- Run `npm run docs:build` from the repository root.
- Review CI on the exact release commit.
- Check the changelog category, release date, version, and comparison link.
- Inspect packed package contents before publication when publishing is enabled.
- Create and push a signed or annotated version tag only after approval.
- Verify the registry artifact and release notes after publication.

## Compatibility considerations

Bizallele’s immutable builder API allows definitions to be specialized safely, but
modifier semantics can affect forms, tables, printed output, and adapters at
once. Release review must therefore consider:

- parsing and formatting order;
- synchronous and asynchronous validation behavior;
- Record events, reset, clear, and change tracking;
- Recordset fetch, sort, filter, and pagination contracts;
- renderer independence and accessible component semantics;
- JavaScript and TypeScript API parity; and
- migration paths for deprecated modifiers.

Deprecation alone may ship in a minor release when existing behavior remains.
Removal belongs in a major release and must update the complete inventory in
[ADR-0001](./adr/0001-retire-post-jack-henry-modifiers.md).

## Current automation boundary

GitHub Actions verifies tests, type checking, and the documentation-site build. Registry
publication and release tagging remain manual. The documentation workflow
uploads and deploys the site to GitHub Pages on pushes to main. npm publication
uses an authenticated maintainer and requires an explicit release request;
passing the local build is not evidence of a registry publication.

Before publication, `npm pack` must include both `dist/index.js` and
`dist/index.d.ts`, plus the documented `form-element` and `example-recordset`
subpaths. The package-build regression test checks these archive entries. Install
the packed archive in a separate application and verify the first-form example
with TypeScript and a production browser build. After publication, repeat those
checks with the exact version downloaded from npm.
