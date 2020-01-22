# Save or skip

Go "Forward" in your browser (get a new page recommendation). Turn any page into an RSS feed. Suggestions based on previous pages you have visited.

## Installation

1. Download <a href='https://github.com/opowell/saveorskip/raw/master/dist-zip/saveorskip-v1.0.6.zip'>extension</a>.
2. Extract zip file contents.
3. In Chrome, turn on Developer mode.
4. Open Extensions page.
5. Load unpacked --> select contents from step 2.

The extension should now be accessible from the top right of the browser (green icon).

## How to use

1. Click the green icon.
2. Click "go forward".

By default, pages you visit are marked as "saved" and generate new suggestions in the future. But this can of course be changed.

## Development setup

1. Clone / download this repository.
2. Install dependencies

- `npm install`

3. Install standalone Vue devtools.

- `npm install --save-dev @vue/devtools`
- `npm install --save-dev "@vue/devtools"`

## Development running

1. Run Vue devtools

- `vue-devtools.cmd`

2. Serve extension

- `npm run watch:dev`

Reload any previously open tabs that you want to test content scripts on.

## Deployment

1. Compile the extension: `npm run build`
2. Zip it up: `npm run build-zip`
3. Commit to Github.
4. Update README.md download link.

## Initial development setup

1. Install vue-kocal template.

- `https://github.com/Kocal/vue-web-extension`

2. Allow external vue-tools.

- Install `@vue/devtools`
- Modify webpack: `content_security_policy: "script-src 'self' 'unsafe-eval' http://localhost:8098; object-src 'self'"`

## Development notes

Vuex store has separate instances for:

- background.js
- options.js
- popup.js
