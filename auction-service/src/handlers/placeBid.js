import AWS from 'aws-sdk';
import createError from 'http-errors';
import commonMiddleware from '../lib/commonMiddleware';
import { getAuction } from './getAuctionById';
import validator from '@middy/validator'
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
   const { id } = event.pathParameters;
   const { amount } = event.body;

   const auction = await getAuction(id);

   // Auction status validation
   if (auction.status !== 'OPEN') {
      throw new createError.Forbidden(`You cannot bid on closed auctions!`);
   }

   // Bid amount validation
   if (amount <= auction.highestBid.amount) {
      throw new createError.BadRequest(`Your bid must be higher than ${auction.highestBid.amount}!`);
   }

   const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set highestBid.amount = :amount',
      ExpressionAttributeValues: {
         ':amount': amount,
      },
      ReturnValues: 'ALL_NEW', // to return the updated auction item
   };

   let updatedAuction;

   try {
      const result = await dynamodb.update(params).promise();
      updatedAuction = result.Attributes;
   } catch (error) {
      console.error(error);
      throw new createError.InternalServerError(error);
   }

   return {
      statusCode: 200,
      body: JSON.stringify(updatedAuction),
   };
}

export const handler = commonMiddleware(placeBid)
   .use(validator({ inputSchema: placeBidSchema }));