# Save or skip

## Installation

1. Download <a href='https://github.com/opowell/saveorskip/raw/master/dist-zip/saveorskip-v1.0.6.zip'>extension</a>.
2. Extract zip file contents.
3. In Chrome, turn on Developer mode.
4. Open Extensions page.
5. Load unpacked --> select contents from step 2.

## Development

1. Run devtools

- `vue-devtools.cmd`

2. Serve extension

- `npm run watch:dev`

## Deployment

1. Compile the extension: `npm run build`
2. Zip it up: `npm run build-zip`

## Initial development setup

1. Install vue-kocal template.

- `https://github.com/Kocal/vue-web-extension`

2. Allow external vue-tools.

- Install `@vue/devtools`
- Modify webpack: `content_security_policy: "script-src 'self' 'unsafe-eval' http://localhost:8098; object-src 'self'"`
