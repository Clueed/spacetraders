import {
  deliverContract,
  dock,
  getMarketplace,
  getShips,
  getSystemWaypoits,
  navigate,
  refuel,
} from "./apiCalls.js";
import { findMarketsForItems } from "./findMarketsForItems.js";
import {
  quicksort,
  selectMarketCombination,
} from "./findOptimalMarketplaceCombinations.js";
import { extractTillFullProcedure, inTransitProcedure } from "./procedures.js";
import { TradeSymbol } from "./types/Good.js";
import { Waypoint } from "./types/Waypoint.js";
import {
  checkArbitrage,
  filterByTrait,
  getInventoryQuantity,
  getMarketInfo,
  getShip,
  groupArbitrages,
  runArbitrage,
  sell,
} from "./util.js";

import { totalMarket } from "./TotalMarket.js";

const unique = totalMarket.uniqueItemSymbols();

const arbitrage = checkArbitrage(totalMarket, unique);

const groupedArbitrage = groupArbitrages(arbitrage);

console.log("arbitrage :>> ", groupedArbitrage);

const myShipsAll = await getShips();

//await navigate(myShipsAll[0].symbol, "X1-ZA40-68707C");
/*

const marktplaceWaypoints = filterByTrait(waypoints, "MARKETPLACE");

const route = quicksort(marktplaceWaypoints);

for (let waypoint of route) {
  await navigate(myShipsAll[0].symbol, waypoint.symbol);

  const marketplace = await getMarketplace(
    waypoint.systemSymbol,
    waypoint.symbol
  );

  totalmarket.addMarketRecord(marketplace);
}*/

console.log("totalmarket :>> ", totalMarket);

runArbitrage(arbitrage[0], myShipsAll[0]);
