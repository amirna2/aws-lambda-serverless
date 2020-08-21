import createError from 'http-errors';
import { getEndedAuctions } from '../lib/getEndedAuctions';
import { closeAuction } from '../lib/closeAuction';

async function processAuctions(event, context) {
   try {
      const auctionsToClose = await getEndedAuctions();
      const closingAcionPromises = auctionsToClose.map(auction => closeAuction(auction));
      await Promise.all(closingAcionPromises)
      return { closed: closingAcionPromises.length };
   } catch (error) {
      console.error(error);
      throw new createError.InternalServerError(error);
   }
}

export const handler = processAuctions;