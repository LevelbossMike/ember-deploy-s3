/* jshint node: true */
'use strict';

var S3Adapter = require('./lib/s3');

module.exports = {
  name: 'ember-deploy-s3',

  type: 'ember-deploy-addon',

  adapters: {
    assets: {
      's3': S3Adapter
    }
  }
}
