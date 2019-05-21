# Page Capture S3

![Architecture Diagram](docs/architecture.png)

A NodeJS Lambda that can capture a single HTML page and all of the associated files that are served from the same domain.  The lambda can push these files to a designated S3 bucket.  This is useful if you have a page being dynamically generated and want to periodically render it to static files that can be served to the web directly out of S3.

For example, capturing the home page at `www.bu.edu` will also pull in and relink associated images, css, js, etc. that are served from the `www.bu.edu/` domain.  External links will be left as.

The lambda is triggered by a secure API gateway interface using an API key.

## How to configure

The capture URL, S3 bucket name, and S3 bucket path are configurable by setting values in a `config.yml` file.

- `CAPTURE_URL` sets the URL to the page to be captured
- `S3_BUCKET_NAME` and `S3_PATH` set the S3 destination for the captured static files

When installing the Lambda, copy the `config.example.yml` to a `config.yml` file and customize the values.  Once installed, they are also available as environment variables in the running Lambda and can be further adjusted from there.

## How to install

Page Capture S3 uses the [serverless framework](https://serverless.com/framework/) to manage the API gateway and Lambda infrastrucure components.  It assumes an existing S3 bucket for the static files.

First install or update [the serverless CLI tool](https://serverless.com/framework/docs/getting-started/), which can generally be done using npm like this:

```bash
npm install -g serverless
```

Also there must be existing AWS cli credentials for the account where the Lambda will be installed (generally `aws config`).

Once the serverless cli is installed, the Lambda infrastructure can be provisioned on AWS using the `deploy` command:

```bash
serverless deploy
```

This will package the Lambda code, compile the `serverless.yml` infrastructure directives to a CloudFormation template, and install a CloudFormation stack in AWS.  The deploy command will also return the following values:

- the stack name in CloudFormation
- an API key named `capturePingKey`: this is necessary to trigger the private API gateway
- an endpoint URL for the API gateway: together with the API key, this can be used to trigger the capture Lambda

## How to trigger

The Lambda can be triggered by an https request to the gateway endpoint that includes the key in a header named `x-api-key`.

For example:

```bash
curl --header "x-api-key: <key>" https://<gateway url>
```

Here is a PHP example using the `wp_remote_get()` function inside WordPress:

```php
$api_key = '<key>';
$api_url = '<gateway url>';

$response = wp_remote_get( $api_url, array( 'timeout' => 30, 'headers' => array( 'x-api-key' => $api_key, ) ) );
```


## How to monitor

CloudWatch logs are provisioned along with the Lambda.  A console link to the CloudWatch events is available in the Resources tab of the CloudFormation stack.  Recent logs are also available through the serverless cli like this:

```bash
serverless logs --function capture
```

This is also available through a yarn run command:

```bash
yarn log
```

## Local testing

The capture Lambda can simulated locally by the serverless cli with this command:

```bash
serverless invoke local --function capture
```

Or using the yarn run shortcut:

```bash
yarn local
```

The local testing simulation isn't perfect; specifically the upload callback doesn't seem to correctly fire, and the files in `/tmp/page-capture` are not correctly deleted.

## How to remove

The Lambda and all of it's associated resources can be removed by deleting the CloudFormation stack.  The existing S3 bucket specified for the static assets will not be affected.

The CloudFormation stack can also be removed using the serverless cli:

```bash
serverless remove
```