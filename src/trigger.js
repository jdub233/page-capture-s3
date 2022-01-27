/**
 * Receives an event from an API gateway endpoint and passes it to SQS
 *
 * Since the page capture process takes longer than the 30 second limit on API Gateway requests,
 * this function responds to the gateway directly while pushing messgage to SQS.
 * The processor function is then triggered by SQS, and can take as long as it needs to.
 * 
 * Modeled after examples here:
 * https://aws.amazon.com/blogs/compute/choosing-between-messaging-services-for-serverless-applications/
 */

 const AWS = require('aws-sdk');
 const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
 
 exports.captureTriggerHandler = async (event, context) => {
 
     const params = {
         MessageBody: `Page capture request at ${Date()}`,
         QueueUrl: process.env.SQSqueueName
     };
 
     const result = await sqs.sendMessage(params).promise();
 
     console.info(`Trigger event received, queued as messageId: ${result.MessageId}`);
 
     return {
         statusCode: 200,
         body: JSON.stringify({ result: 'capture job queued', messageID: result.MessageId })
     };
 }
