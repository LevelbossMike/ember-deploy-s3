var chai           = require('chai');
var chaiAsPromised = require('chai-as-promised');
var MockS3         = require('../../helpers/mock-s3');
var MockUI         = require('ember-cli/tests/helpers/mock-ui');
var S3Adapter      = require('../../../lib/s3');
var chalk          = require('chalk');

chai.use(chaiAsPromised);

var s3Adapter;
var expect = chai.expect;

var getLastUILine = function(output) {
  var uiOutputByLine = output.split('\n');
  return uiOutputByLine[uiOutputByLine.length - 2];
};

var stubConfig = {
  "assets": {
    "accessKeyId": "<your-access-key-goes-here>",
    "secretAccessKey": "<your-secret-access-key-goes-here>",
    "bucket": "<your-bucket-name>"
  }
};
var stubConfigWithPrefix = {
  "assets": {
    "accessKeyId": "<your-access-key-goes-here>",
    "secretAccessKey": "<your-secret-access-key-goes-here>",
    "bucket": "<your-bucket-name>",
    "prefix": "release/assets/"
  }
};

describe('S3Adapter', function() {
  beforeEach(function() {
    s3Adapter = new S3Adapter({
      ui: new MockUI(),
      s3: new MockS3(),
      config: stubConfig
    });
  });

  it('rejects if no ui is passed on initialization', function() {
    s3Adapter = new S3Adapter({
      s3: new MockS3(),
      config: stubConfig
    });
    expect(s3Adapter.upload()).to.be.rejected;
  });

  describe('#upload', function() {
    it("passes the correct params to s3's uploadDir-method", function() {
      var expected = {
        localDir: 'tmp/assets-sync',
        s3Params: {
          ACL: 'public-read',
          Bucket: '<your-bucket-name>',
          Prefix: '',
          CacheControl: 'max-age=63072000, public',
          Expires: new Date('2030')
        }
      };

      s3Adapter.upload();

      var params = s3Adapter.client.uploadParams;
      var actual = {
        localDir: params.localDir,
        s3Params: params.s3Params
      };

      expect(actual).to.eql(expected);
    });

    it("allows the prefix to be customized", function() {
      var s3AdapterCustomPrefix = new S3Adapter({
        ui: new MockUI(),
        s3: new MockS3(),
        config: stubConfigWithPrefix
      });

      var expected = {
        localDir: 'tmp/assets-sync',
        s3Params: {
          ACL: 'public-read',
          Bucket: '<your-bucket-name>',
          Prefix: 'release/assets/',
          CacheControl: 'max-age=63072000, public',
          Expires: new Date('2030')
        }
      };

      s3AdapterCustomPrefix.upload();

      var params = s3AdapterCustomPrefix.client.uploadParams;
      var actual = {
        localDir: params.localDir,
        s3Params: params.s3Params
      };

      expect(actual).to.eql(expected);
    });

    it('rejects when the upload encounters an error', function() {
      var promise = s3Adapter.upload();
      s3Adapter.s3.eventEmitter.emit('error', { stack: 'test error stack' });
      expect(promise).to.be.rejected;
    });

    it('resolves when the upload ends', function() {
      var promise = s3Adapter.upload();
      s3Adapter.s3.eventEmitter.emit('end');
      expect(promise).to.be.resolved;
    });

    it('prints the fingerprinted filename for every fileUpload', function() {
      var fullPath = 'some-path/on-filesystem/filename-f1n63rpr1n7.js';
      var fullKey  = 'does-not-matter-we-dont-use-it';
      var expected = 'Uploading: filename-f1n63rpr1n7.js';

      s3Adapter.upload();
      s3Adapter.s3.eventEmitter.emit('fileUploadStart', fullPath, fullKey);

      var lastLine = getLastUILine(s3Adapter.ui.output);
      expect(chalk.stripColor(lastLine)).to.eq(expected);
    });

    it('also prints the name of non-fingerprinted files', function() {
      var fullPath = 'some-path/on-filesystem/filename.js';
      var fullKey  = 'does-not-matter-we-dont-use-it';
      var expected = 'Uploading: filename.js';

      s3Adapter.upload();
      s3Adapter.s3.eventEmitter.emit('fileUploadStart', fullPath, fullKey);

      var lastLine = getLastUILine(s3Adapter.ui.output);
      expect(chalk.stripColor(lastLine)).to.eq(expected);
    });

    it('marks files with a Content-Encoding of gzip on files that are marked as gzipped', function() {
      var uploadParams = s3Adapter.getUploadParams();
      var s3Params = uploadParams.s3Params;

      ['assets/my-app.js',
       'assets/my-app.css',
       'assets/logo.svg'].forEach(function (filename) {
        uploadParams.getS3Params(filename, null, function (_, additionalParams) {
          expect(additionalParams.ContentEncoding).to.eq('gzip');
        });
      });

      uploadParams.getS3Params('assets/images/logo.png', null, function (_, additionalParams) {
        expect(additionalParams.ContentEncoding).to.eq(undefined);
      });
    });

    it('does not marks files with a Content-Encoding of gzip if gzip is false', function() {
      s3Adapter.config.assets.gzip = false;

      var uploadParams = s3Adapter.getUploadParams();
      var s3Params = uploadParams.s3Params;

      uploadParams.getS3Params('assets/my-app.js', null, function (_, additionalParams) {
        expect(additionalParams.ContentEncoding).to.eq(undefined);
      });
    });
  });
});
