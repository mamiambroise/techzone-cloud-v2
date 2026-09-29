const { environment, root } = require('./environment.cjs');
Object.assign(process.env, environment());
process.chdir(root + '/backend');
require(root + '/backend/dist/main.js');
