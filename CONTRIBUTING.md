# Contributing

## Git Branch Workflow

This project adheres to [GitHub Flow](https://guides.github.com/introduction/flow/).

## Development (Not for customers)

This code base is written in [TypeScript](https://www.typescriptlang.org/) so it cannot be included locally in an application without a build step. Luckily, we have provided one :)

1. Allow NPM package to be linked

   ```sh
   npm link
   ```

1. Start the watch process for building the code when changes occur

   ```sh
   npm start
   ```

1. In your application, link to this package instead of a version on NPM

   ```sh
   npm link @oneblink/apps-react
   ```

## Release Process

1. Checkout `master`

   ```
   git checkout master
   ```

1. Get the latest code

   ```
   git pull
   ```

1. Start the release process

   ```
   npm run release
   ```

## Alpha Release Process

1. This process is only for code in a ticket branch which cannot be merged into master yet, due to an ongoing prior release.

1. Checkout the branch

   ```
   git checkout <branch>
   ```

1. Start the release process

   ```
   npm run release
   ```

1. The version should be set to whatever you anticipate the next version will be with `-alpha.x` appended.

### Example

1. Current version: `3.2.3-beta.2` (when that release is finished it will become `3.2.3`)

1. Depending on the scope of your changes, your first alpha should be: `3.2.4-alpha.1` or `3.3.0-alpha.1`

1. Subsequent alphas should just increment the `-alpha.x` suffix.
