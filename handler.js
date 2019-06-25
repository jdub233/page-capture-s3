const scrape = require('website-scraper');
const s3 = require('s3-node-client');
const del = require('del');
const Url = require('url-parse');

const captureURL = new Url(process.env.CAPTURE_URL);

const scrapeOptions = {
    urls: [`${process.env.CAPTURE_URL}?cachebust=${Date.now()}`],
    urlFilter: function(url) {
        return url.indexOf(`${captureURL.protocol}//${captureURL.host}`) === 0;
    },
    directory: `/tmp/page-capture/capture-${Date.now()}`,
    subdirectories: [
        {directory: 'img', extensions: ['.jpg', '.png', '.svg', '.mp4', '.webm', '.mov']},
        {directory: 'js', extensions: ['.js']},
        {directory: 'css', extensions: ['.css']}
    ],
};

const client = s3.createClient();

const uploadParams = {
    localDir: scrapeOptions.directory,
    deleteRemoved: false,
    s3Params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: process.env.S3_PATH,
    },
};

module.exports.endpoint = async (event, context, callback) => {

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

    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: `Capture status was ${result[0].saved}, run at ${new Date().toString()}, AWS Request ID was ${context.awsRequestId}`,
        }),
    };

  callback(null, response);
};
