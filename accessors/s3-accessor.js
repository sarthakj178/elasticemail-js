
const AWS = require('aws-sdk');
const S3_PATH_REGEX = /s3:\/\/(.[^/]+)\/(.*)/;

module.exports = class S3Accessor {
    constructor() {
        this.s3 = new AWS.S3();
    }
    parseS3Path(s3Path) {
        var [_, s3Bucket, s3Key] = s3Path.match(S3_PATH_REGEX);
        var s3KeyParts = s3Key.split("/");
        var fileName = s3KeyParts[s3KeyParts.length-1];
        return [s3Bucket, s3Key, fileName];
    }
    getFile(s3Bucket, s3Key) {
        return this.s3.getObject({
            Bucket: s3Bucket,
            Key: s3Key,
        }).promise();
    }
}