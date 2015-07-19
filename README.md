# Ember-deploy-s3 [![Build Status](https://travis-ci.org/LevelbossMike/ember-deploy-s3.svg?branch=master)](https://travis-ci.org/LevelbossMike/ember-deploy-s3)

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
