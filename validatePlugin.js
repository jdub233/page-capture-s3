module.exports = class ValidatePlugin {
    apply(registerAction) {
        registerAction('error', async ({error}) => {console.error(error)});
        registerAction('onResourceError', ({resource, error}) => console.log(`Resource ${resource.url} has error ${error}`));
        registerAction('afterResponse', async ({response}) => {   
            if (response.statusCode !== 200) {
                // Don't capture bad assets.  Also cancels the upload phase if the root page has a bad status code.
                console.log( `Bad status code ${response.statusCode} , cancelling asset capture` );
                return null;
            } else {
                return {
                    body: response.body,
                    metadata: {
                        headers: response.headers,
                    }
                };
            }
        });
    }
}
