const scrape = require('website-scraper');
require('dotenv').config();

const options = {
    urls: [process.env.CAPTURE_URL],
    directory: './data/page/',
};

(async () => {
    const result = await scrape(options);
    console.log(result);
})();
