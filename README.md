# Save or skip

## Installation

1. Download extension as zip file.
2. In Chrome, turn on Developer mode.
3. Open Extensions page.
4. Load unpacked --> select zip file from step 1.

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
