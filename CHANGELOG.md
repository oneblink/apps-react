# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- styling for invisible pages on forms

## 0.1.9 (2020-01-18)

### Added

- `geoscapeAddress` form element type

## 0.1.8 (2020-12-22)

### Added

- Checkbox and radio button contrast text determination

## 0.1.7 (2020-12-11)

### Fixed

- Hyperlinks not being clickable and Images not displaying in HTML elements
- barcode scanner on iOS by using `navigator.mediaDevices.getUserMedia()` instead of `navigator.getUserMedia()`

### Dependencies

- no longer depend upon [@blinkmobile/camera](https://www.npmjs.com/package/@blinkmobile/camera)

## 0.1.6 (2020-12-02)

### Fixed

- data lookups in repeatable sets not updating elements that already contain data
- element lookups on multi page forms duplicating all elements
- styles from HTML form elements not being consistent with Forms Builder

## 0.1.5 (2020-11-24)

### Added

- sending userToken with requests

## 0.1.4 (2020-11-12)

### Added

- `isInteger` validation to `number` type form elements
- `minLength` and `maxLength` validation to `text` and `textarea` type form elements
- Support for `includeTimestampWatermark` for `camera` form element type

### Changed

- source from Flow to TypeScript

### Fixed

- auto save icon not getting position fixed styling

### Dependencies

- update [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) to 1.13.0 (from 1.9.12)

- update [bulma](https://www.npmjs.com/package/bulma) to [0.9.1](https://github.com/jgthms/bulma/releases/tag/0.9.1) (from [0.8.2](https://github.com/jgthms/bulma/releases/tag/0.8.2))

- update [bulma-toast](https://www.npmjs.com/package/bulma-toast) to [2.1.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.1.0) (from [2.0.1](https://github.com/rfoel/bulma-toast/blob/master/CHANGELOG.md))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.13.7](https://github.com/sindresorhus/query-string/releases/tag/v6.13.7) (from [6.13.1](https://github.com/sindresorhus/query-string/releases/tag/v6.13.1))

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [1.27.5](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [1.27.3](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

- update [signature_pad](https://www.npmjs.com/package/signature_pad) to [3.0.0-beta.4](https://github.com/szimek/signature_pad/blob/master/CHANGELOG.md) (from [3.0.0-beta.3](https://github.com/szimek/signature_pad/releases/tag/v3.0.0-beta.3))

## 0.1.3 (2020-11-05)

### Added

- `BETWEEN` conditional logic for numeric form elements

### Fixed

- checkboxes button not using option colour
- `number` element inputs not allow decimal in Safari

## 0.1.2 (2020-10-30)

### Added

- Disabled prop to forms to stop multiple submissions

## 0.1.1 (2020-10-15)

### Added

- `data-ob-name` attr to elements
- `useLogin()` hook to help with implementing a custom login screen
- `useAuth()` hook and `<AuthContextProvider />` component

### Fixed

- date / datetime format error in validation
- Scroll service targeting class that wasn't present on DOM

### Removed

- CSS not being used

## 0.1.0 (2020-08-26)

Initial release
