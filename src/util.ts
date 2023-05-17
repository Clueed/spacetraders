import { Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/Good.js";
import {
  _sell,
  _buy,
  getMarketplace,
  getShips,
  navigate,
  refuel,
  _dock,
} from "./apiCalls.js";
import { TraitSymbol, Waypoint } from "./types/Waypoint.js";
import { MarketGood, Marketplace } from "./types/Marketplace.js";
import { TotalMarket, totalMarket } from "./TotalMarket.js";
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
  await autoDock(ship);

  return await _sell(ship.symbol, units, tradeSymbol);
}

export function log(ship: Ship, message: string) {
  console.info(`${ship.symbol} @ ${ship.nav.waypointSymbol}: ${message}`);
}

export function logError(ship: Ship, error: any) {
  console.error(`${ship.symbol} @ ${ship.nav.waypointSymbol}: ERROR:`);
  console.error(error);
}

export async function autoDock(ship: Ship) {
  try {
    const response = await _dock(ship.symbol);
    if (response.status === 200) {
      log(ship, "Docked");
      return;
    } else {
      logError(ship, response);
    }
  } catch (error) {
    logError(ship, error);
  }
}

export async function buy(ship: Ship, units: number, tradeSymbol: TradeSymbol) {
  log(ship, `Initiating purchase of ${units}x ${tradeSymbol}`);
  await autoDock(ship);
  try {
    await _buy(ship.symbol, tradeSymbol, units);
    log(ship, "");
  } catch (error) {
    throw error;
  }
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

export type Quote = {
  symbol: TradeSymbol;
  price: number;
  marketplace: Marketplace;
  type: "ASK" | "BID";
};

export type Arbitrage = {
  symbol: TradeSymbol;
  bid: Quote;
  ask: Quote;
  spread: number;
};

export function checkArbitrage(
  totalMarket: TotalMarket,
  tradeSymbols: TradeSymbol[]
): Arbitrage[] {
  let arbitrage: Arbitrage[] = [];

  for (let symbol of tradeSymbols) {
    const ask = totalMarket.getBestPrice(symbol, "ASK");
    const bid = totalMarket.getBestPrice(symbol, "BID");
    if (ask && bid) {
      const spread = bid.price - ask.price;
      if (spread > 0) {
        arbitrage.push({ bid, ask, spread, symbol });
      }
    }
  }

  arbitrage.sort((a, b) => b.spread - a.spread);

  return arbitrage;
}

export function groupArbitrages(arbitrage: Arbitrage[]) {
  const groupedData: { [key: string]: any } = {};

  arbitrage.forEach((item) => {
    const askSymbol = item.ask.marketplace.symbol;
    const bidSymbol = item.bid.marketplace.symbol;

    if (!groupedData[askSymbol]) {
      groupedData[askSymbol] = { ask: [], bid: [] };
    }
    if (!groupedData[bidSymbol]) {
      groupedData[bidSymbol] = { ask: [], bid: [] };
    }

    groupedData[askSymbol].ask.push(item);
    groupedData[bidSymbol].bid.push(item);
  });

  return groupedData;
}

export function getMarketGood(
  marketplace: Marketplace,
  tradeSymbol: TradeSymbol
): MarketGood | null {
  if (!marketplace.tradeGoods) {
    return null;
  }

  for (let tradeGood of marketplace.tradeGoods!) {
    if (tradeGood.symbol === tradeSymbol) {
      return tradeGood;
    }
  }

  return null;
}

export async function runArbitrage(arbitrage: Arbitrage, ship: Ship) {
  log(ship, `Running ${arbitrage.symbol} arbitrage.`);

  for (let trade of ["BUY", "SELL"]) {
    await navigate(
      ship.symbol,
      trade === "BUY"
        ? arbitrage.ask.marketplace.symbol
        : arbitrage.bid.marketplace.symbol
    );

    const shipStatus = await getShip(ship.symbol);

    const currentMarket = await getMarketplace(
      shipStatus.nav.systemSymbol,
      shipStatus.nav.waypointSymbol
    );

    await autoRefuel(currentMarket, shipStatus);

    const arbitrageGood = getMarketGood(currentMarket, arbitrage.symbol);

    if (!arbitrageGood) {
      throw new Error("Arbitrage good no longer sold here.");
      // TODO:
      // If can't purchase return
      // If can't sell, pick next best price even at loss.
    }

    const slippage =
      trade === "BUY"
        ? arbitrageGood.purchasePrice - arbitrage.ask.price
        : arbitrageGood.sellPrice - arbitrage.bid.price;

    if (slippage !== 0) {
      if (trade === "BUY") {
        return;
      }
      console.error("SLIPPING");
    }

    if (trade === "BUY") {
      const inventoryCapacity =
        shipStatus.cargo.capacity - shipStatus.cargo.units;

      const response = await buy(
        shipStatus,
        inventoryCapacity,
        arbitrage.symbol
      );
      console.log("response :>> ", response);
    }

    if (trade === "SELL") {
      const amount = getInventoryQuantity(shipStatus, arbitrage.symbol);
      const response = await sell(shipStatus, amount, arbitrage.symbol);
      console.log("response :>> ", response);
    }
  }
  return;
}

export async function autoRefuel(
  marketplace: Marketplace,
  ship: Ship,
  maxMarkup: number = 5
): Promise<void> {
  const fuelGood = getMarketGood(marketplace, "FUEL");
  const bestFuelQuote = totalMarket.getBestPrice("FUEL", "ASK");

  if (!fuelGood || !bestFuelQuote) {
    return;
  }

  const fuelMarkup = Math.floor(
    (fuelGood.purchasePrice / bestFuelQuote.price - 1) * 100
  );

  if (fuelMarkup < maxMarkup) {
    console.info(
      `${ship.symbol} @ ${ship.nav.systemSymbol}: Refuelling at ${fuelMarkup}% markup.`
    );
    await autoDock(ship);
    await refuel(ship.symbol);
  }
}
