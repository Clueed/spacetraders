import { InventoryItem, Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/TradeSymbols.js";
import { _sell, dock, getMarketplace, getShips } from "./apiCalls.js";
import { Trait, Waypoint } from "./types/Waypoint.js";
import { Marketplace } from "./types/Marketplace.js";
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

export async function getMarketInfo(waypoints: Waypoint[]) {
  const waypointsWithMarketplaces = waypoints.filter((waypoint) => {
    return waypoint.traits.some((trait) => {
      return trait.symbol === "MARKETPLACE";
    });
  });

  const marketplaces = await Promise.all(
    waypointsWithMarketplaces.map(async (waypoint) => {
      return await getMarketplace(waypoint.systemSymbol, waypoint.symbol);
    })
  );
  return marketplaces;
}

export function findMarketsForItems(
  inventory: InventoryItem[],
  marketplaces: Marketplace[]
) {
  let marketInvenstoryOverlap: any = {};

  marketplaces.map((marketplace) => {
    marketInvenstoryOverlap[marketplace.symbol] = [];
  });

  for (let marketplace of marketplaces) {
    for (let item of inventory) {
      if (
        marketplace.imports.some(
          (importItem) => importItem.symbol === item.symbol
        )
      ) {
        marketInvenstoryOverlap[marketplace.symbol].push(item.symbol);
      }
    }
  }

  for (let m in marketInvenstoryOverlap) {
    if (marketInvenstoryOverlap[m].length === 0) {
      delete marketInvenstoryOverlap[m];
    }
  }

  return marketInvenstoryOverlap;
}
