# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

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
