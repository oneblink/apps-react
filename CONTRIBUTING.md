# Contributing

## Git Branch Workflow

This project adheres to [GitHub Flow](https://guides.github.com/introduction/flow/).

## Beta Release Process

1. Checkout `master` and get the latest code

   ```
   git checkout master && git pull
   ```

1. Bump the version and create a release commit

   ```
   npm version x.x.x-beta.x --message "[RELEASE] %s"
   ```

1. Push changes to the `master` branch

   ```
   git push && git push --tags
   ```

1. Publishes to `npm` are automated via CI on tag creation

## Production Release Process

1. Checkout `master` and get the latest code

   ```
   git checkout master && git pull
   ```

1. Run CLI `npx package-diff-summary {last-tag}`

1. Copy result (if there is one) under a _Dependencies_ heading in [Changelog](./CHANGELOG.md)

1. Update the [Changelog](./CHANGELOG.md) by replacing `Unreleased` with `x.x.x (YYYY-MM-DD)`

1. Commit changes to the `master` branch

   ```
   git add -A && git commit -m "[CHANGELOG] x.x.x"
   ```

1. Bump the version and create a release commit

   ```
   npm version x.x.x --message "[RELEASE] %s"
   ```

1. Push changes to the `master` branch

   ```
   git push && git push --tags
   ```

1. Publishes to `npm` are automated via CI on tag creation
