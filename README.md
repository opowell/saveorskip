# sos-kocal2

## Build steps.

1. Install vue-kocal template.
   https://github.com/Kocal/vue-web-extension
2. Allow external vue-tools.

- Install @vue/devtools
- Modify webpack: content_security_policy: "script-src 'self' 'unsafe-eval' http://localhost:8098; object-src 'self'"

3. Run devtools
   vue-devtools.cmd

4. Serve extension
   npm run watch:dev
