# OneBlink Apps - ReactJS | Usage

This library has a peer dependency on [@oneblink/apps](https://www.npmjs.com/package/@oneblink/apps). Please ensure you have read the usage documentation on [Tenants](https://oneblink.github.io/apps/#tenants) before starting to use this library.

## Requirements

- [Node.js](https://nodejs.org/) 20.0 or newer
- NPM 8.0 or newer

## Installation

```sh
npm install react@17 react-dom@17 @oneblink/apps-react --save
```

## Peer Dependencies

- [@oneblink/apps](https://www.npmjs.com/package/@oneblink/apps)
- [react](https://www.npmjs.com/package/react)
- [react-dom](https://www.npmjs.com/package/react-dom)
- [react-router-dom](https://www.npmjs.com/package/react-router-dom)
- [@mui/lab](https://www.npmjs.com/package/@mui/lab)
- [@mui/material](https://www.npmjs.com/package/@mui/material)
- [@mui/x-date-pickers](https://www.npmjs.com/package/@mui/x-date-pickers)

## Build Tool Considerations

This library utilises React's lazy loading with dynamic imports for certain components. Depending on your choice of build tool, this can result in a large amount of chunked Javascript files once your project is built.

Below are some examples for common build tools on how to manage these chunks:

### Using Webpack v5

```js
module.exports = {
  //...,
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        arcgis: {
          test: /[\\/]node_modules[\\/]((@arcgis)|(@esri))[\\/]/,
          name: 'arcgis',
          chunks: 'all',
        },
      },
    },
  },
}
```

### Using Vite v4

```js
export default defineConfig(() => ({
  build: {
    //...,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@arcgis') || id.includes('@esri')) {
            return 'arcgis'
          }
        },
      },
    },
  },
}))
```
