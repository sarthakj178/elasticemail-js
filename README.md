# elasticemail-js

## Installation
``` npm install --save @sarthakj178/elasticemail-client ```

## Usage
```
sendMailUsingTemplate('<ELASTIC_EMAIL_API_KEY>', '<ELASTIC_EMAIL_TEMPLATE_ID>', 
  '<FROM_EMAIL_ADDRESS>', '<FROM_NAME>', 
  ['<TO_EMAIL_ADDRESS_1>', '<TO_EMAIL_ADDRESS_2>'],
  ['<CC_EMAIL_ADDRESS_1>', '<CC_EMAIL_ADDRESS_2>'], 
  ['<BCC_EMAIL_ADDRESS_1>', '<BCC_EMAIL_ADDRESS_2>'] 
  'Test Subject', {
      'param1': 'value1', 
      'param2': 'value2'
  }, ['s3://<BUCKET_NAME>/PATH/TO/FILE_1', 's3://<BUCKET_NAME>/PATH/TO/FILE_2']).then((res) => {
    console.log(res);
  }, (err) => {
    console.error(err);
  }
);
```
