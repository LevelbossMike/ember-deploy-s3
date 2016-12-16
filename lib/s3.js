var CoreObject   = require('core-object');
var Promise      = require('ember-cli/lib/ext/promise');
var SilentError  = require('silent-error');
var chalk        = require('chalk');

var white = chalk.white;
var green = chalk.green;

var EXPIRE_IN_2030 = new Date('2030');
var TWO_YEAR_CACHE_PERIOD_IN_SEC = 60 * 60 * 24 * 365 * 2;

module.exports = CoreObject.extend({
  init: function() {
    if (!this.config) {
      return Promise.reject(new SilentError('You have to pass a config!'));
    }

    this.s3 = this.s3 || require('s3');
    this.client = this.s3.createClient({
      maxAsyncS3: 1,
      s3Options: this.config.assets
    });
  },

  upload: function() {
    var client = this.client;
    var _this  = this;

    if (!this.ui) {
      var message = 'You have to pass a UI to an adapter.';
      return Promise.reject(new SilentError(message));
    }

    this.ui.startProgress(green('Uploading assets'), green('.'));

    return new Promise(function(resolve, reject) {
      var uploader = client.uploadDir(_this.getUploadParams());

      uploader.on('error', _this.logUploadError.bind(_this, reject));

      uploader.on('end', _this.logUploadSuccess.bind(_this, resolve));

      uploader.on('fileUploadStart', _this.logFileUpload.bind(_this));

      uploader.on('fileUploadEnd', _this.logFileUploadEnd.bind(_this, resolve));
    });
  },

  getUploadParams: function() {
    return {
      localDir: 'tmp/assets-sync',
      s3Params: {
        ACL: this.config.assets.acl || 'public-read',
        Bucket: this.config.assets.bucket,
        Prefix: this.config.assets.prefix || '',
        CacheControl: 'max-age='+TWO_YEAR_CACHE_PERIOD_IN_SEC+', public',
        Expires: EXPIRE_IN_2030
      },
      getS3Params: this.getS3Params.bind(this)
    }
  },

  getS3Params: function(localFile, stat, callback) {
    if (this.config.assets.gzip === false) {
      return callback(null, {});
    }

    var gzipExtensions = this.config.assets.gzipExtensions ? this.config.assets.gzipExtensions : ['js', 'css', 'svg'];
    var ext = localFile.replace(/.*[\.\/\\]/, '').toLowerCase();
    var isGzippedContent = gzipExtensions.indexOf(ext) != -1;
    var additionalParams = isGzippedContent ? { ContentEncoding: 'gzip' } : {};

    callback(null, additionalParams);
  },

  logFileUpload: function(fullPath, _) {
    var fileNameMatches = fullPath.match(/\/((\w*[-]\w*||\w*)[.]\w*)/);
    if (fileNameMatches) {
      this.ui.writeLine('Uploading: ' + green(fileNameMatches[1]));
    }
    this.fileUploadPending = true;
  },

  logFileUploadEnd: function(resolve, localFilePath, _s3Key) {
    this.fileUploadPending = false;
    if (this.s3ThinksWeAreFinished) {
      this.printEndMessage();
      resolve();
    }
  },

  logUploadError: function(reject, error) {
    var errorMessage = 'Unable to sync: ' + error.stack;
    reject(new SilentError(errorMessage));
  },

  logUploadSuccess: function(resolve) {
    if (this.fileUploadPending) {
      // s3 screws up some times when only uploading one image
      this.s3ThinksWeAreFinished = true;
    }
    else {
      this.printEndMessage();
      resolve();
    }
  },

  printEndMessage: function() {
    this.ui.writeLine('Assets upload successful. Done uploading.');
    this.ui.stopProgress();
  }
});
