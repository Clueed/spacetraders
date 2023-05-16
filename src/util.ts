import { Ship } from "./types/Ship.js";
import { Good, TradeSymbol } from "./types/Good.js";
import {
  _sell,
  _buy,
  dock,
  getMarketplace,
  getShips,
  navigate,
} from "./apiCalls.js";
import { Trait, TraitSymbol, Waypoint } from "./types/Waypoint.js";
import { MarketGood, Marketplace } from "./types/Marketplace.js";
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

  return await _sell(ship.symbol, units, tradeSymbol);
}

export async function buy(ship: Ship, units: number, tradeSymbol: TradeSymbol) {
  if (ship.nav.status === "IN_ORBIT") {
    await dock(ship);
  }

  return await _buy(ship.symbol, tradeSymbol, units);
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
      const spread = ask.price - bid.price;
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
  console.info(`${ship.symbol}: Running ${arbitrage.symbol} arbitrage.`);

  await navigate(ship.symbol, arbitrage.bid.marketplace.symbol);

  const shipStatus = await getShip(ship.symbol);
  const currentMarket = await getMarketplace(
    shipStatus.nav.systemSymbol,
    shipStatus.nav.waypointSymbol
  );

  const bidGood = getMarketGood(currentMarket, arbitrage.symbol);

  if (!bidGood) {
    throw new Error("Bid good no longer sold.");
  }

  const slippage = bidGood.purchasePrice - arbitrage.bid.price;

  if (slippage !== 0) {
    console.info(
      `${ship.symbol}: Bid price slipped from ${arbitrage.bid.price} to ${bidGood?.purchasePrice} (${slippage})`
    );
  }

  if (slippage > 0) {
    // check if still profitable
    console.log("STIL PROFITABLE?");
  }

  const invCapacity = shipStatus.cargo.capacity - shipStatus.cargo.units;

  console.info(
    `${ship.symbol}: Purchase ${invCapacity}x ${arbitrage.symbol} for ${bidGood.purchasePrice}`
  );

  await dock(ship);
  const buyResponse = await buy(shipStatus, invCapacity, arbitrage.symbol);

  console.log("buyResponse :>> ", buyResponse);

  await navigate(ship.symbol, arbitrage.ask.marketplace.symbol);

  const shipStatus2 = await getShip(ship.symbol);

  const askMarket = await getMarketplace(
    shipStatus2.nav.systemSymbol,
    shipStatus2.nav.waypointSymbol
  );

  const askGood = getMarketGood(askMarket, arbitrage.symbol);

  if (!askGood) {
    throw new Error("Ask good no longer sold.");
  }

  const askSlippage = askGood.purchasePrice - arbitrage.ask.price;

  if (slippage !== 0) {
    console.info(
      `${ship.symbol}: Ask price slipped from ${arbitrage.ask.price} to ${askGood?.purchasePrice} (${askSlippage})`
    );
  }

  if (slippage < 0) {
    // check if still profitable
    console.log("STIL PROFITABLE?");
  }

  await dock(shipStatus2);
  const sellResponse = await sell(ship, invCapacity, arbitrage.symbol);

  const pnlperUnit = askGood.purchasePrice - bidGood.sellPrice;

  const pnlTotal = pnlperUnit * invCapacity;

  console.info(
    `${invCapacity}x ${askGood.purchasePrice} - ${bidGood.sellPrice}= ${pnlTotal} (${pnlperUnit}/u)`
  );
}
