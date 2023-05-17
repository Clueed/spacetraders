import {
  getMarketplace,
  getShips,
  getSystemWaypoits,
  getWaypoint,
  navigate,
} from "./apiCalls.js";
import {
  Quote,
  autoRefuel,
  checkArbitrage,
  getInventoryQuantity,
  getShip,
  runArbitrage,
  sell,
} from "./util.js";

import { totalMarket } from "./TotalMarket.js";
import { Waypoint } from "./types/Waypoint.js";
import { selectMarketCombination } from "./findOptimalMarketplaceCombinations.js";
import { quicksort } from "./findOptimalMarketplaceCombinations.js";

const unique = totalMarket.uniqueItemSymbols();

const arbitrage = checkArbitrage(totalMarket, unique);

const myShipsAll = await getShips();

/*if (myShipsAll[0].cargo.capacity === myShipsAll[0].cargo.units) {
  const ship = await getShip(myShipsAll[0].symbol);

  let sellingRoute: Waypoint[] = [];

  let sellingItems: { [waypointSymbol: string]: Quote[] } = {};

  for (let tradeItems of ship.cargo.inventory) {
    const quote = totalMarket.getBestPrice(tradeItems.symbol, "BID");
    if (quote) {
      const waypointSymbol = quote.marketplace.symbol;
      const waypoint = await getWaypoint(waypointSymbol);

      sellingRoute.push(waypoint);

      if (sellingItems[waypointSymbol]) {
        sellingItems[waypointSymbol].push(quote);
      } else {
        sellingItems[waypointSymbol] = [quote];
      }
    }
  }

  const optimizedRoute = quicksort(sellingRoute);

  if (ship.nav.waypointSymbol === optimizedRoute[0].symbol) {
    for (let quote of sellingItems[optimizedRoute[0].symbol]) {
      const amount = getInventoryQuantity(ship, quote.symbol);
      await sell(ship, amount, quote.symbol);
    }
  } else {
    await navigate(ship.symbol, optimizedRoute[0].symbol);
    const currentMarket = await getMarketplace(
      optimizedRoute[0].systemSymbol,
      optimizedRoute[0].symbol
    );
    await autoRefuel(currentMarket, ship);
  }
}*/

runArbitrage(arbitrage[0], myShipsAll[0]);
