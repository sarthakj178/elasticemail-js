const request = require('request-promise');
const fs = require('fs');
const S3Accessor = require('./accessors/s3-accessor');
const FormData = require('form-data');

let s3Accessor = new S3Accessor();

const SEND_EMAIL_URL = "https://api.elasticemail.com/v2/email/send";
const UPLOAD_FILE_URL = "https://api.elasticemail.com/v2/file/upload";
const API_KEY = "apikey";
const SUBJECT_KEY = "subject";
const FROM_KEY = "from";
const FROM_NAME_KEY = "fromName";
const MSG_TO_KEY = "msgTo";
const MSG_CC_KEY = "msgCC";
const TEMPLATE_KEY = "template";
const ATTACHMENT_KEY = "attachments";
const ADDITIONAL_PARAM_PREFIX = "merge_";
const IS_TRANSACTIONAL_KEY = "isTransactional";
const IS_TRANSACTIONAL_VALUE = "true";
const ATTACHMENT_NAME = "name";
const SEPARATOR = ",";
const TEMP_DIR = '/tmp/';

var uploadAttachment = function(apiKey, name, stream) {
    var url = UPLOAD_FILE_URL + "?" + API_KEY + "=" + apiKey + "&" + ATTACHMENT_NAME + "=" + name;    
    let form = new FormData();
    form.maxDataSize = Infinity;
    form.append('file', stream);
    return request.post({url: url, formData: {
        file: {
            value: stream,
            options: {
                filename: name,
            }
        }
    }}).then((out) => {
        try {
            res = JSON.parse(out);
        } catch (error) {
            console.error("Invalid response from ElasticEmail while uploading Attachments", error, out);
            return Promise.reject("Invalid response from ElasticEmail while uploading Attachments");
        }
        if (res.success === false) {
            console.error("Invalid response from ElasticEmail while uploading Attachments", out.body);
            return Promise.reject("Invalid response from ElasticEmail while uploading Attachments");
        }
        console.log("Uploaded", name);
        return;
    });
}

var sendMailUsingTemplate = function(
    apiKey, templateId, fromEmailAddress, fromName, toEmailAddresses, 
    ccEmailAddresses = [], bccEmailAddresses = [], subject, emailParams = {}, attachmentsS3Paths = []) {
        
        var toEmailAddresses = toEmailAddresses.join(SEPARATOR);
        var ccEmailAddresses = ccEmailAddresses.length > 0 ? ccEmailAddresses.join(SEPARATOR) : '';
        var bccEmailAddresses = bccEmailAddresses.length > 0 ? bccEmailAddresses.join(SEPARATOR) : '';
        
        let queryStringParams = {
            [API_KEY]: apiKey,
            [SUBJECT_KEY]: subject,
            [FROM_KEY]: fromEmailAddress,
            [FROM_NAME_KEY]: fromName,
            [MSG_TO_KEY]: toEmailAddresses,
            [MSG_CC_KEY]: ccEmailAddresses,
            [TEMPLATE_KEY]: templateId,
            [IS_TRANSACTIONAL_KEY]: IS_TRANSACTIONAL_VALUE, 
        }
        Object.keys(emailParams).forEach((key) => {
            queryStringParams[ADDITIONAL_PARAM_PREFIX + key] = emailParams[key] ? emailParams[key] : "<b></b>";
        })
        var getAttachmentPromises = [];
        var attachmentNames = [];
        if (attachmentsS3Paths.length > 0) {
            attachmentsS3Paths.forEach((path) => {
                let [s3Bucket, s3Key, fileName] = s3Accessor.parseS3Path(path);
                attachmentNames.push(fileName);

                var tempFilePath = TEMP_DIR + fileName
                getAttachmentPromises.push(s3Accessor.getFile(s3Bucket, s3Key).then((data) => {
                    fs.writeFileSync(tempFilePath, data.Body);
                    return uploadAttachment(
                        apiKey, fileName, fs.createReadStream(tempFilePath)).then((res) => {
                            return res;
                        }, (err) => {
                            return Promise.reject(err);
                        });    
                }));
            })
        }
        queryStringParams[[ATTACHMENT_KEY]] = attachmentNames.join(SEPARATOR)
        return Promise.all(getAttachmentPromises).then((responses) => {
            return request({
                method: 'POST',
                url: SEND_EMAIL_URL,
                qs: queryStringParams
            }).then((response) => {
                try {
                    response = JSON.parse(response);
                } catch (error) {
                    console.error("Invalid response from ElasticEmail", error);
                    return Promise.reject("Invalid response from ElasticEmail");
                }
                if (response.success === false) {
                    return Promise.reject("Error while sending email");
                }
                console.log("Mail sent");
                return Promise.resolve();
            }, (error) => {
                console.error("Error while sending email", error);
                return Promise.reject("Error while sending email");
            });
        }, (err) => {
            console.error("Error while processing mail attachments", err);
            return Promise.reject("Error while processing mail attachments");
        })
}

exports.sendMailUsingTemplate = sendMailUsingTemplate;
exports.uploadAttachment = uploadAttachment;