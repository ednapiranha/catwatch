/* eslint-env node */

'use strict';

const nconf = require('nconf');

nconf.argv().env().file({ file: 'local.json' });

nconf.defaults({
  port: 3000,
  limit: 50
});

module.exports = nconf;
