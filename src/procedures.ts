import { extract } from "./apiCalls.js";
import { Ship } from "./types/Ship.js";
import { sell, sleep } from "./util.js";
/**
 * Asynchronously extracts cargo from current location until it is full,
 * handling any cooldown periods between extractions.
 *
 * @param {string} shipSymbol - The name of the ship to extract cargo from.
 * @return {Promise<void>} A Promise that resolves when the ship is full.
 */
export async function extractTillFullProcedure(
  shipSymbol: string
): Promise<void> {
  while (true) {
    try {
      const extractionStatus = await extract(shipSymbol);
      if (extractionStatus.full) {
        break;
      }
      if (extractionStatus.cooldown > 0) {
        await sleep(extractionStatus.cooldown);
      }
    } catch (error) {
      console.error(error);
      break;
    }
  }
}
/**
 * Asynchronous function that logs the estimated time of arrival for a ship to its destination and sleeps until the
 * estimated time of arrival has been reached.
 *
 * @param {Ship} ship - The ship object with destination and route information.
 * @return {Promise<void>} - A promise that resolves when the ship has arrived at its destination.
 */

export async function inTransitProcedure(ship: Ship): Promise<void> {
  const { type, symbol } = ship.nav.route.destination;
  const arrivalDate = new Date(ship.nav.route.arrival);

  const deltaEta = arrivalDate.getTime() - new Date().getTime();

  const deltaEtaDate = new Date(deltaEta);
  const [etaMinutes, etaSeconds] = [
    deltaEtaDate.getMinutes(),
    deltaEtaDate.getSeconds(),
  ];
  console.log(
    `${ship.symbol}: In transit to ${type} ${symbol}. ETA: T-${etaMinutes}:${etaSeconds}`
  );
  await sleep(deltaEta);
}

export async function sellAllProcedure(ship: Ship) {
  const inventory = ship.cargo.inventory;

  for (let item of inventory) {
    await sell(ship, item.units, item.symbol);
  }
}
