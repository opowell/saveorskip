# Development notes

## Setup

1. Clone / download this repository.
2. Install dependencies
   - `npm install`
3. Install standalone Vue devtools.
   - `npm install --save-dev "@vue/devtools"`

## Running

1. Run Vue devtools
   - `./node_modules/.bin/vue-devtools`
2. Serve extension
   - `npm run watch:dev`
3. Install extension in browser (see README.md, substituting the zip file contents with the "dist" folder contents).

## Deployment

1. Increase version number in `package.json` and `src/manifest.json`.
2. Compile the extension: `npm run build`
3. Zip it up: `npm run build-zip`
4. Update README.md download link.
5. Commit to Github.

## Initial setup

1. Install vue-kocal template.

- `https://github.com/Kocal/vue-web-extension`

2. Allow external vue-tools.

- Install `@vue/devtools`
- Modify webpack: `content_security_policy: "script-src 'self' 'unsafe-eval' http://localhost:8098; object-src 'self'"`

## Vuex

Vuex store has separate instances for:

- background.js
- options.js
- popup.js
