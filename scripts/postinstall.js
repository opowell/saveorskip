const replace = require('replace-in-file');
replace({
  files: 'node_modules/@vue/devtools/build/backend.js',
  from: /console\.log/g,
  to: 'console.debug',
});
