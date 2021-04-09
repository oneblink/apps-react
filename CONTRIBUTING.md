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

## Beta Release Process

1. Checkout `master` and get the latest code

   ```
   git checkout master
   ```

1. Get the latest code

   ```
   git pull
   ```

1. Bump the version and create a release commit

   ```
   npm version x.x.x-beta.x --message "[RELEASE] %s"
   ```

1. Push changes to the `master` branch

   ```
   git push
   ```

1. Push new tag

   ```
   git push --tags
   ```

## Production Release Process

1. Checkout `master` and get the latest code

   ```
   git checkout master
   ```

1. Get the latest code

   ```
   git pull
   ```

1. Run CLI `npx package-diff-summary {last-tag}`

1. Copy result (if there is one) under a `### Dependencies` heading in [Changelog](./CHANGELOG.md)

1. Update the [Changelog](./CHANGELOG.md) by adding `## [x.x.x] - YYYY-MM-DD` under `## Unreleased`

1. Stage changes

   ```
   git add -A
   ```

1. Commit changes to the `master` branch

   ```
   git commit -m "[CHANGELOG] x.x.x"
   ```

1. Bump the version and create a release commit

   ```
   npm version x.x.x --message "[RELEASE] %s"
   ```

1. Push changes to the `master` branch

   ```
   git push
   ```

1. Push new tag

   ```
   git push --tags
   ```
