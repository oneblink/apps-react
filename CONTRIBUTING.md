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
