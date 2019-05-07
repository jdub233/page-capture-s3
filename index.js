const scrape = require('website-scraper');
const s3 = require('s3-node-client');
const fs = require('fs-extra');

require('dotenv').config();

const scrapeOptions = {
    urls: [process.env.CAPTURE_URL],
    urlFilter: function(url) {
        return url.indexOf(process.env.CAPTURE_URL) === 0;
    },
    directory: './data/page/',
};

const client = s3.createClient();

const uploadParams = {
    localDir: 'data/page',
    deleteRemoved: true,
    s3Params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: process.env.S3_PATH,
    },
};

(async () => {
    const result = await scrape(scrapeOptions);
    console.log('capture complete');
    if (result[0].saved) {
        //If successful, upload files
        console.log('uploading');
        const uploader = client.uploadDir(uploadParams);

        uploader.on('error', function(err) {
            console.error("unable to sync:", err.stack);
        });
        uploader.on('end', function() {
            console.log("done uploading, removing local files");
            fs.remove('./data/page/', err =>{
                if (err) {
                    return console.error(err);
                }
                console.log('success, local files removed');
            });

        });
    };

})();
