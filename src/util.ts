import { Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/Good.js";
import { _sell, dock, getMarketplace, getShips } from "./apiCalls.js";
import { Trait, TraitSymbol, Waypoint } from "./types/Waypoint.js";
import { Marketplace } from "./types/Marketplace.js";
import { TotalMarket } from "./TotalMarket.js";
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

export async function sell(
  ship: Ship,
  units: number,
  tradeSymbol: TradeSymbol
) {
  if (ship.nav.status === "IN_ORBIT") {
    await dock(ship);
  }

  await _sell(ship.symbol, units, tradeSymbol);
}

export function filterByTrait(waypoints: Waypoint[], traitSymbol: TraitSymbol) {
  return waypoints.filter((waypoint) => {
    return waypoint.traits.some((waypointTrait) => {
      return waypointTrait.symbol === traitSymbol;
    });
  });
}

export async function getMarketInfo(
  waypoints: Waypoint[]
): Promise<Marketplace[]> {
  const waypointsWithMarketplaces = filterByTrait(waypoints, "MARKETPLACE");

  const marketplaces = await Promise.all(
    waypointsWithMarketplaces.map(async (waypoint) => {
      return await getMarketplace(waypoint.systemSymbol, waypoint.symbol);
    })
  );
  return marketplaces;
}

export function checkArbitrage(totalMarket: TotalMarket);
