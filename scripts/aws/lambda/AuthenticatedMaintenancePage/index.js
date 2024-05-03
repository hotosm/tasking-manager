
/**
 * BASIC Authentication
 *
 * Simple authentication script intended to be run by Amazon Lambda to
 * provide Basic HTTP Authentication for a static website hosted in an
 * Amazon S3 bucket through Couldfront.
 *
 * https://hackernoon.com/serverless-password-protecting-a-static-website-in-an-aws-s3-bucket-bfaaa01b8666
 *
 * To deploy, add this script to a new Lambda function using Nodejs 12.x and permissions using the maintenancepage-role.json file.
 * Then add a CloudFront Lambda@Edge trigger with the Cloudfront distribution, and selecting Viewer Request for Cloudfront event.
 */

'use strict';

const content = `
<\!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Tasking Manager is undergoing Maintenance</title>
    <link rel="stylesheet" href="https://unpkg.com/tachyons@4.10.0/css/tachyons.min.css"/>
    <style>
    .container {
        background-color: #d73f3f;
        position: absolute;
        top: 40%;
        width: 110%;
        padding: 50px;
    }
    </style>
  </head>
  <body >
    <article class="center mw5 mw6-ns hidden ba mv4">
      <h1 class="f4 bg-dark-red white mv0 pv2 ph3">Tasking Manager Maintenance</h1>
      <div class="pa3 bt">
        <p class="f6 f5-ns lh-copy measure mv0">
          Tasking Manager is currently down for Maintenance. Please refer to
          our <a href="https://status.hotosm.org/" class="link b black bg-animate hover-bg-dark-red">Status Page</a> for more details. Thank you
          for your patience.
        </p>
      </div>
    </article>
  </body>
</html>
`;

exports.handler = (event, context, callback) => {

    // Get request and request headers
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Configure authentication
    const authUser = 'hotosm';
    const authPass = 'hardtoguesspassword';

    // Construct the Basic Auth string
    const authString = 'Basic ' + new Buffer(authUser + ':' + authPass).toString('base64');

    // Require Basic authentication
    if (typeof headers.authorization == 'undefined' || headers.authorization[0].value != authString) {
        const response = {
            status: '401',
            statusDescription: 'Unauthorized',
            body: content,
            headers: {
                'www-authenticate': [{key: 'WWW-Authenticate', value:'Basic'}]
            },
        };
        callback(null, response);
    }

    // Continue request processing if authentication passed
    callback(null, request);
};
