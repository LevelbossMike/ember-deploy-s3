# Ember-deploy-s3 [![Build Status](https://travis-ci.org/LevelbossMike/ember-deploy-s3.svg?branch=master)](https://travis-ci.org/LevelbossMike/ember-deploy-s3)

![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-deploy-github.svg)

<hr/>
**WARNING: This plugin is only compatible with ember-cli-deploy versions < 0.5.0 and deprecated in favor of [ember-cli-deploy-s3](https://github.com/ember-cli-deploy/ember-cli-deploy-s3). Please consider upgrading to an up to date version of [ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy) when using in production**
<hr/>

This is the s3-adapter implementation to use [s3](aws.amazon.com/s3/) with
[ember-deploy](https://github.com/levelbossmike/ember-deploy).

# Minimum S3 Policy Requirements

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets"
            ],
            "Resource": [
                "arn:aws:s3:::*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::<your-bucket-name>"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:DeleteObject",
                "s3:GetObject",
                "s3:GetObjectAcl",
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::<your-bucket-name>/*"
            ]
        }
    ]
}
```

# A note about deployments and `buildEnv`

[ember-cli-deploy](https://www.github.com/ember-cli/ember-cli-deploy) gives you an option called `buildEnv` in `config/deploy.js`. This option is meant to be used for production-like environments like for example `staging` that should behave like production (concatenate js files, minify build, fingerprint assets) but are using other settings than production specified in `config/environment.js` in your Ember application.

The `buildEnv` option is used to to pass the respective environment to the `ember build`-command that ember-cli-deploy is using to build your application before uploading files. If `buildEnv` is not specified `ember-cli-deploy` will use `production` as the default setting.

Though you could in theory specify a buildEnv `development` in your `deploy.js` it is encouraged not to do so. There are multiple reasons for this.

1. When you want to deploy your application you want assets to be concatenated, minified and fingerprinted which will not be done when building for the `development` environment.
2. Deploying your application is not part of your development workflow. When you want to try out stuff in your ember application you should do so when developing locally on your development machine.
3. If you want to have specific logging output in different environments or different api-hosts across environments there is `config/environment.js` to create a production-like environment and [Ember.Logger](http://emberjs.com/api/classes/Ember.Logger.html) to do any logging that you need to be doing.
4. Because assets are not fingerprinted and `ember-deploy-s3` will upload your assets with basically a 'cache-forever' setting you will not get the latest assets served to your browser after deploying your application to s3. This is annoying to debug and will cost you lots of time if you decide to use a `buildEnv` 'development' (You have been warned ;))

Instead what you should be doing when the need for multiple different deployable environments arises is to create `production-like` environments for these environments. There's a section in the [ember-cli-deploy docs](http://ember-cli.github.io/ember-cli-deploy/docs/v0.4.x/fingerprinting-options-and-staging-environments/) how to do this. In the provided example you would also need to pass `staging` as the `buildEnv` option if you wanted to use different api-hosts for `production` and `staging` provided from `environment.js`.

# Known Issues

Uploads tend to hang when you don't specify the region your bucket is located in in `config/deploy.js` it is thus recommended to add the region your bucket is located in to your S3 configuration:

```
// config/deploy.js
module.exports = {
  //...

   production: {
    // ...
    assets: {
      accessKeyId: '<your-access-key-goes-here>',
      secretAccessKey: process.env['AWS_ACCESS_KEY'],
      bucket: '<your-bucket-name>',
      region: '<your-region (e.g. eu-west-1)>'
    }
  }
};
```
