/**
 * A Lambda function that captures a given page as static files, and uploads the files to S3.
 */

const scrape = require('website-scraper');
const s3 = require('s3-node-client');
const del = require('del');
const Url = require('url-parse');

const ValidatePlugin = require('./page-capture/validatePlugin');

const captureURL = new Url(process.env.CAPTURE_URL);

// Allow for a prefix to the subdirectory, and add a slash if it is set.
const subDirPrefix = (process.env.SUBDIR_PREFIX !== '') ? `${process.env.SUBDIR_PREFIX}/` : '';

const client = s3.createClient();

exports.pageCapture = async (event, context, callback) => {
    // Track the event source for logging purposes
    let eventMessage = '';

    // For SQS triggers, grab the message ID
    if ( event.Records ) {
        // Parse SQS the queue event.
        const { Records: [ message, ...rest ] } = event;
        const { messageId } = message;
        eventMessage = `SQS message id was ${messageId}`
    }
    
    // Scheduled events can be detected by the event.source
    if ( event.source === "aws.events" ) {
        eventMessage = "Triggered by a schedule"
    }

    const scrapeOptions = {
        urls: [`${process.env.CAPTURE_URL}?cachebust=${Date.now()}`],
        urlFilter: function(url) {
            return url.indexOf(`${captureURL.protocol}//${captureURL.host}`) === 0;
        },
        directory: `/tmp/page-capture/capture-${Date.now()}`,
        subdirectories: [
            {directory: `${subDirPrefix}img`, extensions: ['.jpg', '.png', '.svg', '.gif', '.mp4', '.webm', '.mov']},
            {directory: `${subDirPrefix}js`, extensions: ['.js']},
            {directory: `${subDirPrefix}css`, extensions: ['.css']},
            {directory: `${subDirPrefix}font`, extensions: ['.woff', '.woff2', '.ttf', '.eot']},
        ],
        plugins: [ new ValidatePlugin() ],
    };

    const uploadParams = {
        localDir: scrapeOptions.directory,
        deleteRemoved: false,
        s3Params: {
            Bucket: process.env.S3_BUCKET_NAME,
            Prefix: process.env.S3_PATH,
        },
    };

    const result = await scrape(scrapeOptions);

    if (result[0].saved) {
        //If successful, upload files
        console.log('capture successful, now uploading to S3');
        const uploader = client.uploadDir(uploadParams);

        uploader.on('error', function(err) {
            console.error("unable to sync:", err.stack);
            console.log(`Bucket was: ${process.env.S3_BUCKET_NAME} and prefix was ${process.env.S3_PATH} `);
        });
        uploader.on('end', function() {
            console.log("done uploading, deleting local files");

            (async () => {
                deletedPaths = await del(['/tmp/page-capture/*'], {force: true});
                console.log('deleted temp files at: ', deletedPaths);
            })();

        });
    };

    const response = `Capture status was ${result[0].saved}, ${eventMessage}`;
    console.info(response);

    callback(null, response);
}
