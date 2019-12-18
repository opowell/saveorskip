# Save or skip

Save pages you visit. Get recommendations based on your previous saves.

## Installation

1. Download <a href='https://github.com/opowell/saveorskip/raw/master/dist-zip/saveorskip-v1.0.6.zip'>extension</a>.
2. Extract zip file contents.
3. In Chrome, turn on Developer mode.
4. Open Extensions page.
5. Load unpacked --> select contents from step 2.

The extension should now be accessible from the top right of the browser (green icon).

## How to use

1. Visit a website you like.
2. Click the green icon.
3. Click "Save and go".

This saves the current link, searches for further recommendations, picks one and then sends you to it.

## Development

1. Run devtools

- `vue-devtools.cmd`

2. Serve extension

- `npm run watch:dev`

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
