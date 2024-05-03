/**
 * BASIC Authentication
 *
 * Simple maintenance page script that displays a message when users attempt to access a site served via CloudFront.
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
  </head>
  <body bg-light->
    <article class="center mw5 mw6-ns hidden ba mv4">
      <h1 class="f4 bg-dark-red white mv0 pv2 ph3">Tasking Manager Maintenance</h1>
      <div class="pa3 bt">
        <p class="f6 f5-ns lh-copy measure mv0">
          Tasking Manager is temporarily unavailable while we perform scheduled maintenance.
          Refer to the HOTOSM <a href="https://status.hotosm.org/" class="link b black bg-animate hover-bg-dark-red">Status Page</a> for more details. We appreciate
          your patience and understanding and will do our best to keep the downtime to a minimum.
        </p>
      </div>
    </article>
  </body>
</html>
`;

exports.handler = (event, context, callback) => {
    /*
     * Generate HTTP OK response using 200 status code with HTML body.
     */
    const response = {
        status: '200',
        statusDescription: 'OK',
        headers: {
            'cache-control': [{
                key: 'Cache-Control',
                value: 'max-age=100'
            }],
            'content-type': [{
                key: 'Content-Type',
                value: 'text/html'
            }],
            'content-encoding': [{
                key: 'Content-Encoding',
                value: 'UTF-8'
            }],
        },
        body: content,
    };
    callback(null, response);
};
