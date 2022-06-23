# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `onReplace()` to `useInfiniteScrollDataLoad()`

## [1.2.1] - 2022-06-17

### Added

- `freshdeskDependentField` form element

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.1-beta.5](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.4.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.4.0))

## [1.2.0] - 2022-06-02

### Added

- `unwindRepeatableSets` parameter to form store

## [1.1.1] - 2022-05-31

### Changed

- load images from canvases use [HTMLCanvasElement.toBlob()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) instead of using fetch to request base 64 data uris

### Fixed

- calculation element not working with compliance element types

## [1.1.0] - 2022-05-05

### Added

- `removeAutoSaveDataBeforeSubmit` and `removeAutoSaveDataBeforeSaveDraft` parameters to `useFormSubmissionAutoSaveState()` and `<OneBlinkAutoSaveForm />`

### Fixed

- colour variant for `<LargeIconMessage />` title

## [1.0.0] - 2022-05-03

### Added

- `MuiV4CompatibleDatePicker`
- `MuiV4CompatibleDateTimePicker`
- `MuiV4CompatibleTimePicker`

### Dependencies

- no longer depend upon [@mui/material](https://www.npmjs.com/package/@mui/material)

- depend upon [@mui/icons-material](https://www.npmjs.com/package/@mui/icons-material) [5.6.2](https://github.com/mui/material-ui/releases/tag/v5.6.2)

- depend upon [date-fns](https://www.npmjs.com/package/date-fns) [2.28.0](https://github.com/date-fns/date-fns/releases/tag/v2.28.0)

- depend upon [react-table](https://www.npmjs.com/package/react-table) [7.7.0](https://github.com/TanStack/react-table/releases/tag/v7.7.0)

## [0.6.2] - 2022-04-19

### Dependencies

- update [@emotion/react](https://www.npmjs.com/package/@emotion/react) to 11.9.0 (from 11.8.2)

- update [@mui/material](https://www.npmjs.com/package/@mui/material) to [5.6.1](https://github.com/mui/material-ui/releases/tag/v5.6.1) (from [5.5.3](https://github.com/mui/material-ui/releases/tag/v5.5.3))

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.4.0](https://github.com/oneblink/sdk-core-js/releases/tag/v0.4.0) (from [0.3.6](https://github.com/oneblink/sdk-core-js/releases/tag/v0.3.6))

## [0.6.1] - 2022-04-13

### Dependencies

- update [@mui/material](https://www.npmjs.com/package/@mui/material) to [5.5.3](https://github.com/mui/material-ui/releases/tag/v5.5.3) (from [5.5.1](https://github.com/mui/material-ui/releases/tag/v5.5.1))

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.6](https://github.com/oneblink/sdk-core-js/releases/tag/v0.3.6) (from [0.3.4-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) to 2.7.0 (from 2.4.0)

- update [blueimp-load-image](https://www.npmjs.com/package/blueimp-load-image) to 5.16.0 (from 5.14.0)

- update [flatpickr](https://www.npmjs.com/package/flatpickr) to [4.6.11](https://github.com/flatpickr/flatpickr/releases/tag/v4.6.11) (from [4.6.9](https://github.com/flatpickr/flatpickr/releases/tag/v4.6.9))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.1.1](https://github.com/sindresorhus/query-string/releases/tag/v7.1.1) (from [7.0.1](https://github.com/sindresorhus/query-string/releases/tag/v7.0.1))

- update [react-signature-canvas](https://www.npmjs.com/package/react-signature-canvas) to [1.0.5](https://github.com/agilgur5/react-signature-canvas/releases/tag/v1.0.5) (from [1.0.3](https://github.com/agilgur5/react-signature-canvas/releases/tag/v1.0.3))

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [2.7.0](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [2.5.1](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

## [0.6.0] - 2022-03-29

### Fixed

- elements under a section in repeatable sets not being pre-filled

## Peer Dependencies

- **[BREAKING]** update [react](https://www.npmjs.com/package/react) to [^17.0.0](https://github.com/facebook/react/blob/main/CHANGELOG.md) (from [^16.14.0](https://github.com/facebook/react/blob/main/CHANGELOG.md))
- **[BREAKING]** update [react-dom](https://www.npmjs.com/package/react-dom) to [^17.0.0](https://github.com/facebook/react/blob/main/CHANGELOG.md) (from [^16.14.0](https://github.com/facebook/react/blob/main/CHANGELOG.md))

## Dependencies

- no longer depend upon [@material-ui/core](https://www.npmjs.com/package/@material-ui/core)
- depend upon [@emotion/react](https://www.npmjs.com/package/@emotion/react) 11.8.2
- depend upon [@emotion/styled](https://www.npmjs.com/package/@emotion/styled) 11.8.1
- depend upon [@mui/material](https://www.npmjs.com/package/@mui/material) [5.5.1](https://github.com/mui/material-ui/releases/tag/v5.5.1)

## [0.5.8] - 2022-03-02

### Added

- added conditional `ob-section__valid` class to section element
- Trimming to user input element types

### Changed

- import generateFormElementsConditionallyShown and flattenFormElements from @oneblink/sdk-core

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.4-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.3.2-beta.6](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.5.7] - 2022-01-27

### Fixed

- Image Attachments not updating when deleting Repeatable Set Entries

### Added

- `attachmentRetentionInDays` prop to `<OneBlinkForm />`

### Changed

- steps to have a scroll bar horizontally on multi-page forms on larger screens

## [0.5.6] - 2022-01-19

### Fixed

- input icons not being centered

## [0.5.5] - 2021-12-21

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.2-beta.6](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.3.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.5.4] - 2021-12-09

### Added

- ABN form element

### Dependencies

- depend upon [xml2js](https://www.npmjs.com/package/xml2js) 0.4.23

## [0.5.3] - 2021-12-06

### Fixed

- number slider rendering incorrectly when starting on non-active page

## [0.5.2] - 2021-12-02

### Added

- freshdesk fields to dynamic options sets

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.3.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.2.3](https://github.com/oneblink/sdk-core-js/releases/tag/v0.2.3))

## [0.5.1] - 2021-11-24

### Added

- Validation for allowing extensionless attachments

### Fixed

- Year being returned from Intl date formatter as only digits in iOS15

### Dependencies

- no longer depend upon [abort-controller](https://www.npmjs.com/package/abort-controller)

## [0.5.0] - 2021-11-15

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.2.3](https://github.com/oneblink/sdk-core-js/releases/tag/v0.2.3) (from [0.1.3](https://github.com/oneblink/sdk-core-js/releases/tag/v0.1.3))

## [0.4.20] - 2021-11-01

### Added

- lookups to files elements

### Fixed

- summary element not working inside repeatable set

## [0.4.19] - 2021-10-19

### Fixed

- Date display in summary element and date element clipboard copy in USA time

## [0.4.18] - 2021-10-15

### Fixed

- Date display in summary element and date element clipboard copy in USA time

## [0.4.17] - 2021-09-24

### Added

- BSB form element

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.3](https://github.com/oneblink/sdk-core-js/releases/tag/v0.1.3) (from [0.1.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) to 2.4.0 (from 2.2.0)

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [2.5.1](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [2.4.0](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

- depend upon [react-input-mask](https://www.npmjs.com/package/react-input-mask) [2.0.4](https://github.com/sanniassin/react-input-mask/releases/tag/2.0.4)

## [0.4.16] - 2021-09-20

### Dependencies

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.3-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.1-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

### Changed

- file extension restrictions to be case insensitive

## [0.4.15] - 2021-09-09

### Fixed

- attachments in section elements not preventing submissions while uploading

## [0.4.14] - 2021-09-08

### Added

- `setResult` to result from `userLoadDataState()` hook

### Fixed

- return type for `useNullableState()` hook

### Dependencies

- rollback [color](https://www.npmjs.com/package/color) to [3.2.1](https://github.com/Qix-/color/releases/tag/3.2.1) (from [4.0.1](https://github.com/Qix-/color/releases/tag/4.0.1))

## [0.4.13] - 2021-09-01

### Dependencies

- update [@material-ui/core](https://www.npmjs.com/package/@material-ui/core) to [4.12.3](https://github.com/mui-org/material-ui/releases/tag/v4.12.3) (from [4.12.2](https://github.com/mui-org/material-ui/releases/tag/v4.12.2))

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.1-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

- update [bulma-toast](https://www.npmjs.com/package/bulma-toast) to [2.4.1](https://github.com/rfoel/bulma-toast/releases/tag/v2.4.1) (from [2.3.1](https://github.com/rfoel/bulma-toast/releases/tag/v2.3.1))

- update [color](https://www.npmjs.com/package/color) to [4.0.1](https://github.com/Qix-/color/releases/tag/4.0.1) (from [3.2.1](https://github.com/Qix-/color/releases/tag/3.2.1))

## [0.4.12] - 2021-08-20

### Fixed

- date only going back a day in New York timezone after lookup

## [0.4.11] - 2021-08-12

### Fixed

- reCAPTCHA token being included in submission

## [0.4.10] - 2021-08-04

### Fixed

- date format in US locale

## [0.4.9] - 2021-08-03

### Fixed

- date only formatting
- `draw` form element drawing offset on multi page forms

## [0.4.8] - 2021-07-20

### Fixed

- logging with Sentry errors
- `OneBlinkReadOnlyForm` component crashing when trying to render a form with nested elements

### Dependencies

- update [@material-ui/core](https://www.npmjs.com/package/@material-ui/core) to [4.12.2](https://github.com/mui-org/material-ui/releases/tag/v4.12.2) (from [4.12.1](https://github.com/mui-org/material-ui/releases/tag/v4.12.1))

- update [color](https://www.npmjs.com/package/color) to [3.2.1](https://github.com/Qix-/color/releases/tag/3.2.1) (from [3.1.3](https://github.com/Qix-/color/releases/tag/3.1.3))

## [0.4.7] - 2021-07-19

### Fixed

- location elements with lookups looping due to reference changes

### Dependencies

- update [@material-ui/core](https://www.npmjs.com/package/@material-ui/core) to [4.12.1](https://github.com/mui-org/material-ui/releases/tag/v4.12.1) (from [4.11.4](https://github.com/mui-org/material-ui/releases/tag/v4.11.4))

- update [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) to [0.1.0-beta.3](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md) (from [0.1.0-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md))

## [0.4.6] - 2021-07-07

### Fixed

- calculations being reset after lookup

### Dependencies

- depend upon [@oneblink/sdk-core](https://www.npmjs.com/package/@oneblink/sdk-core) [0.1.0-beta.1](https://github.com/oneblink/sdk-core-js/blob/master/CHANGELOG.md)

## [0.4.5] - 2021-07-05

### Fixed

- validation on nested forms not trigging until form has a value in submission

## [0.4.4] - 2021-06-30

### FAQ

- [How do I implement auto saving with a controlled form?](./docs/faq/how-to-implement-auto-save.md)

### Added

- [`<OneBlinkFormControlled />`](./docs/OneBlinkFormControlled.md) component
- [`useFormSubmissionAutoSaveState()`](./docs/useFormSubmissionAutoSaveState.md) hook
- [`useFormSubmissionState()`](./docs/useFormSubmissionState.md) hook
- parsing validation for initial submission and data lookup result data

### Fixed

- conditional logic referencing elements inside nested sections

### Dependencies

- update [bulma](https://www.npmjs.com/package/bulma) to [0.9.3](https://github.com/jgthms/bulma/releases/tag/0.9.3) (from [0.9.2](https://github.com/jgthms/bulma/releases/tag/0.9.2))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.0.1](https://github.com/sindresorhus/query-string/releases/tag/v7.0.1) (from [7.0.0](https://github.com/sindresorhus/query-string/releases/tag/v7.0.0))

## [0.4.3] - 2021-06-26

### Fixed

- date only parsing in timezones behind UTC

## [0.4.2] - 2021-06-25

### Fixed

- reCAPTCHA tokens being duplicated when cleaning submission data

## [0.4.1] - 2021-06-23

### Added

- `definition` to POST payload for lookup requests
- `civicaNameRecord` form element
- `civicaStreetName` form element
- `boolean` form element
- `section` form element

### Fixed

- `Barcode Scanner` element auto lookup not sending relevant data

### Dependencies

- update [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) to 2.2.0 (from 2.1.1)

- update [bulma-toast](https://www.npmjs.com/package/bulma-toast) to [2.3.1](https://github.com/rfoel/bulma-toast/releases/tag/v2.3.1) (from [2.3.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.3.0))

## [0.4.0] - 2021-06-06

### Added

- Toggle all button to Checkbox and Select (multi only) element

### Changed

- Barcode Scanner lookups to run automatically on scan
- **[BREAKING]** radio and checkbox inputs to Material UI

## [0.3.3] - 2021-06-02

### Added

- Support for customisable buttons
- Support for custom regex validation
- validation for `camera` form element to ensure an image is selected
- replaceable parameter `{INDEX}` in HTML elements nested in repeatable sets

### Changed

- Hide Add button if repeatable set already has max number of entries

### Fixed

- prefill data on multiple pages overriding parsing of prefill data in subsequent pages

## [0.3.2] - 2021-05-26

### Added

- icons to right side of inputs for form elements:
  - `'number'`
  - `'barcodeScanner'`
  - `'telephone'`
  - `'email'`
  - `'date'`
  - `'datetime'`
  - `'time'`

### Changed

- Only capture date from date element
- days offset to `date` and `datetime`

### Dependencies

- update [escape-string-regexp](https://www.npmjs.com/package/escape-string-regexp) to [5.0.0](https://github.com/sindresorhus/escape-string-regexp/releases/tag/v5.0.0) (from [4.0.0](https://github.com/sindresorhus/escape-string-regexp/releases/tag/v4.0.0))

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [2.4.0](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [2.3.3](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

- depend upon [clsx](https://www.npmjs.com/package/clsx) [1.1.1](https://github.com/lukeed/clsx/releases/tag/v1.1.1)

## [0.3.1] - 2021-05-19

### Fixed

- conditional logic loop false positives

## [0.3.0] - 2021-05-13

### Fixed

- auto save data being saved after submission

### Added

- Support for private and public file storage types
- Support for `displayAsCurrency` prop in calculation element

### Changed

- **[BREAKING]** `draw` form element to require Done button press before the drawing is added to the submission data

### Dependencies

- no longer depend upon [@blinkmobile/canvas-manipulation](https://www.npmjs.com/package/@blinkmobile/canvas-manipulation)

- update [@material-ui/core](https://www.npmjs.com/package/@material-ui/core) to [4.11.4](https://github.com/mui-org/material-ui/releases/tag/v4.11.4) (from [4.11.3](https://github.com/mui-org/material-ui/releases/tag/v4.11.3))

- update [jsqr](https://www.npmjs.com/package/jsqr) to 1.4.0 (from 1.3.1)

- depend upon [uuid](https://www.npmjs.com/package/uuid) [8.3.2](https://github.com/uuidjs/uuid/blob/master/CHANGELOG.md)

## [0.2.4] - 2021-04-27

### Added

- `zoom` property to location form elements submission data

### Fixed

- orientation of images uploading to `files` form elements

### Added

- Captured exceptions for certain element failures with Sentry
- required \* to `files` and `repeatableSet` form element labels

### Fixed

- options sets with invalid options never finishing loading
- autocomplete with search url
  - not URL encoding search parameters
  - not validating options returned from request

## [0.2.3] - 2021-04-15

### Changed

- Tooltip library to use material-ui tooltip

### Added

- Point Address element

### Fixed

- inputs in sub forms in repeatable sets having duplicate `id` properties, causing a bug with `date`, `datetime`, `time` elements not setting the value selected on the submission data

### Dependencies

- no longer depend upon [react-tooltip](https://www.npmjs.com/package/react-tooltip)

- depend upon [@material-ui/core](https://www.npmjs.com/package/@material-ui/core) [4.11.3](https://github.com/mui-org/material-ui/releases/tag/v4.11.3)

## [0.2.2] - 2021-03-31

### Fixed

- validation class on `telephone` element not consistent with other elements

### Dependencies

- update [bulma-toast](https://www.npmjs.com/package/bulma-toast) to [2.3.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.3.0) (from [2.2.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.2.0))

- update [query-string](https://www.npmjs.com/package/query-string) to [7.0.0](https://github.com/sindresorhus/query-string/releases/tag/v7.0.0) (from [6.14.1](https://github.com/sindresorhus/query-string/releases/tag/v6.14.1))

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [2.3.3](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [2.3.2](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

## [0.2.1] - 2021-03-23

### Added

- Compliance element type
- `hint` to form elements with a label displayed

### Dependencies

- no longer depend upon [bulma-tooltip](https://www.npmjs.com/package/bulma-tooltip)

- depend upon [react-tooltip](https://www.npmjs.com/package/react-tooltip) [4.2.15](https://github.com/wwayne/react-tooltip/blob/master/CHANGELOG.md)

## [0.2.0] - 2021-03-17

### Fixed

- calculations inside repeatable sets using values from all entries

### Changed

- scroll behavior when changing pages

### Removed

- **[BREAKING]** `position: fixed` CSS from multiple page form navigation on mobile screen sizes

## [0.1.14] - 2021-03-11

### Fixed

- location element loading styles
- Auto lookups no longer run in read only forms

### Dependencies

- update [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) to 2.1.1 (from 1.13.0)

- update [bulma](https://www.npmjs.com/package/bulma) to [0.9.2](https://github.com/jgthms/bulma/releases/tag/0.9.2) (from [0.9.1](https://github.com/jgthms/bulma/releases/tag/0.9.1))

- update [bulma-toast](https://www.npmjs.com/package/bulma-toast) to [2.2.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.2.0) (from [2.1.0](https://github.com/rfoel/bulma-toast/releases/tag/v2.1.0))

- update [file-saver](https://www.npmjs.com/package/file-saver) to [2.0.5](https://github.com/eligrey/FileSaver.js/blob/master/CHANGELOG.md) (from [2.0.2](https://github.com/eligrey/FileSaver.js/releases/tag/v2.0.2))

- update [flatpickr](https://www.npmjs.com/package/flatpickr) to [4.6.9](https://github.com/flatpickr/flatpickr/releases/tag/v4.6.9) (from [4.6.6](https://github.com/flatpickr/flatpickr/releases/tag/v4.6.6))

- update [query-string](https://www.npmjs.com/package/query-string) to [6.14.1](https://github.com/sindresorhus/query-string/releases/tag/v6.14.1) (from [6.13.7](https://github.com/sindresorhus/query-string/releases/tag/v6.13.7))

- update [sanitize-html](https://www.npmjs.com/package/sanitize-html) to [2.3.2](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md) (from [1.27.5](https://github.com/apostrophecms/sanitize-html/blob/master/CHANGELOG.md))

## [0.1.13] - 2021-03-03

### Added

- [`useLoadDataState`](./docs/useLoadDataState.md) hook
- [`<OneBlinkReadOnlyForm />`](./docs/OneBlinkReadOnlyForm.md) component

## [0.1.12] - 2021-02-18

### Fixed

- Files not being able to be re-added to files and camera element after being removed
- inconsistent margin for form element error messages
- Handled error when attempting to convert file to image in `Camera` element

## [0.1.11] - 2021-02-15

### Changed

- bulma toasts and flatpickr pickers to be appended to elements inside the `<OneBlinkForm />` component instead of appended to `document.body`.

## [0.1.10] - 2021-02-09

### Fixed

- styling for add files button
- styling for invisible pages on forms
- Email element showing label twice

## [0.1.9] - 2020-01-18

### Added

- `geoscapeAddress` form element type

## [0.1.8] - 2020-12-22

### Added

- Checkbox and radio button contrast text determination

## [0.1.7] - 2020-12-11

### Fixed

- Hyperlinks not being clickable and Images not displaying in HTML elements
- barcode scanner on iOS by using `navigator.mediaDevices.getUserMedia()` instead of `navigator.getUserMedia()`

### Dependencies

- no longer depend upon [@blinkmobile/camera](https://www.npmjs.com/package/@blinkmobile/camera)

## [0.1.6] - 2020-12-02

### Fixed

- data lookups in repeatable sets not updating elements that already contain data
- element lookups on multi page forms duplicating all elements
- styles from HTML form elements not being consistent with Forms Builder

## [0.1.5] - 2020-11-24

### Added

- sending userToken with requests

## [0.1.4] - 2020-11-12

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

## [0.1.3] - 2020-11-05

### Added

- `BETWEEN` conditional logic for numeric form elements

### Fixed

- checkboxes button not using option colour
- `number` element inputs not allow decimal in Safari

## [0.1.2] - 2020-10-30

### Added

- Disabled prop to forms to stop multiple submissions

## [0.1.1] - 2020-10-15

### Added

- `data-ob-name` attr to elements
- `useLogin()` hook to help with implementing a custom login screen
- `useAuth()` hook and `<AuthContextProvider />` component

### Fixed

- date / datetime format error in validation
- Scroll service targeting class that wasn't present on DOM

### Removed

- CSS not being used

## [0.1.0] - 2020-08-26

Initial release
