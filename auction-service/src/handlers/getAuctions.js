import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors'
import validator from '@middy/validator'
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  const { status } = event.queryStringParameters;
  let auctions;

  // query auctions by status
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
    ExpressionAttributeNames: {
      '#status': 'status', // status is a reserved word, so we need to translate it to the 'status' used in our table
    },

  };

  try {
    const results = await dynamodb.query(params).promise();
    auctions = results.Items;

  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error); // TODO: replace with user facing error rather than forward HTTP status internal error
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auctions }),
  };
}

export const handler = commonMiddleware(getAuctions)
  .use(validator({ inputSchema: getAuctionsSchema, useDefaults: true }));