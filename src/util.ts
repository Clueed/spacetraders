import { Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/TradeSymbols.js";
import { getShips } from "./apiCalls.js";
import { Trait, Waypoint } from "./types/Waypoint.js";
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function getShipsLocation(queryShips: string[]) {
  const ships = await getShips();

  let shipLocations: any = {};

  ships.map((ship: any) => {
    if (queryShips.includes(ship.symbol)) {
      shipLocations[ship.symbol] = ship.nav.waypointSymbol;
    }

    return shipLocations;
  });
}

/**
 * Get the ship object with the given symbol from the list of available ships.
 *
 * @param {string} shipSymbol - The symbol of the ship to retrieve.
 * @return {Promise<object>} The ship object with the given symbol.
 */

export async function getShip(shipSymbol: string) {
  const ships = await getShips();
  return ships.filter((ship) => ship.symbol === shipSymbol)[0];
}

/**
 * Returns the quantity of a specified item symbol in a given ship's inventory.
 *
 * @param {Ship} ship - The ship object whose inventory will be searched.
 * @param {TradeSymbol} itemSymbol - The symbol of the item to search for.
 * @return {number} The quantity of the specified item in the ship's inventory.
 */
export function getInventoryQuantity(ship: Ship, itemSymbol: TradeSymbol) {
  for (let { symbol, units } of ship.cargo.inventory) {
    if (symbol === itemSymbol) {
      return units;
    }
  }
  return 0;
}
