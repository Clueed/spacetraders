import { Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/Good.js";
import { getMarketplace, getShips } from "./api/apiCalls.js";
import { Waypoint } from "./types/Waypoint.js";
import { WaypointTraitSymbol } from "./types/Trait.js";
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

export async function getShip(shipSymbol: string) {
  const ships = await getShips();
  return ships.filter((ship) => ship.symbol === shipSymbol)[0];
}

export function getInventoryQuantity(ship: Ship, itemSymbol: TradeSymbol) {
  for (let { symbol, units } of ship.cargo.inventory) {
    if (symbol === itemSymbol) {
      return units;
    }
  }
  return 0;
}

export function i(ship: Ship) {
  return `${ship.symbol} @ ${ship.nav.waypointSymbol}`;
}

export function filterByTrait(
  waypoints: Waypoint[],
  traitSymbol: WaypointTraitSymbol
) {
  return waypoints.filter((waypoint) => {
    return waypoint.traits.some((waypointTrait) => {
      return waypointTrait.symbol === traitSymbol;
    });
  });
}

export async function getMarketplacesFromWaypoints(
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
