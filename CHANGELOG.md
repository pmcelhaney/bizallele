# Changelog

All notable changes to Bizallele will be documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Rename FDL to Bizallele, with the package name `bizallele`.
  Update imports from `@pmcelhaney/fdl` to `bizallele`, including
  subpaths. Existing `fdl-*` custom elements and exported `Fdl*` classes retain
  their names. The repository and documentation URLs retain their existing paths.
- Use the supplied Bizallele logo in the documentation site and README.

This rename is local preparation for a future release; it does not publish
`bizallele` to npm.

## [0.0.2] - 2026-10-16

### Fixed

- Include the root JavaScript entry point in the npm package so imports from
  `@pmcelhaney/fdl` work alongside the public TypeScript declarations.
- Include the documented `example-recordset` module in package builds.
- Use the standard root import in the first-form guide and README after
  verifying the packed package in an independent consumer application.
- Preserve TypeScript resolution of root declarations and package subpaths.

### Added

- Check the packed archive for all declared root entry points and documented
  adapter and example-recordset subpaths before release.

## Earlier repository work

### Added

- An in-site documentation library with API and adapter contracts, project guides,
  architecture decisions, and section links built from repository Markdown.

- A single documentation site with an introduction, contributor guidance, and
  one page per modifier with examples and explicit adapter limitations.
- Continuous integration for tests, static type checking, and the documentation-site
  production build.
- A documented release and compatibility checklist.

### Changed

- **Breaking:** modifiers now chain directly on immutable field definitions.
  Start custom definitions with the exported `field` instance or specialize a
  primitive. Records and recordsets prepare runtime behavior automatically.
  Remove sentence-style aliases and replace builder construction with `field`;
  see the [field binding guide](./docs/field-type.md#field-operations).

- The repository landing page now leads with the product problem FDL solves and
  includes a reproducible first-run path.

### Fixed

- Install the published npm package directly in the first-form guide instead of
  requiring a repository checkout and locally packed archive.

- Correct the README scheduling example, clarify primitive conversion and default
  lifecycle behavior, document synchronous/async validation boundaries, and align
  the adapter and modifier reference with current multiselect and emptiness rules.

### Removed

- The separate portfolio application, original example home page, and all-in-one
  cookbook page. The documentation site is now served at the root URL.

### Deprecated

- Renderer-specific and legacy modifiers listed in
  [ADR-0001](./docs/adr/0001-retire-post-jack-henry-modifiers.md). Their eventual
  removal requires a future breaking release.

## Repository baseline

Earlier repository history used a `1.0.0` manifest before the current prerelease
versioning. That value is not evidence of a published 1.0 release. The verified
patch release above follows the published npm version `0.0.1`; earlier work is
listed separately because its release boundaries have not been reconstructed.
