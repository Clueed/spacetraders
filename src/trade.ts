import {
  deliverContract,
  dock,
  getMarketplace,
  getShips,
  getSystemWaypoits,
  navigate,
  refuel,
} from "./apiCalls.js";
import {
  extractTillFullProcedure,
  inTransitProcedure,
  sellAllProcedure,
} from "./procedures.js";
import { Marketplace } from "./types/Marketplace.js";
import { InventoryItem } from "./types/Ship.js";
import { TradeSymbol } from "./types/TradeSymbols.js";
import { Waypoint } from "./types/Waypoint.js";
import {
  findMarketsForItems,
  getInventoryQuantity,
  getMarketInfo,
  getShip,
  sell,
} from "./util.js";

const contractItem: TradeSymbol = "ALUMINUM_ORE";
const asteroidFieldLocationSymbol = "X1-DF55-17335A";
const contractId = "clheig9zm4i5ls60ddxtdkirp";
const contractLocationSymbol = "X1-DF55-20250Z";

const myShipsAll = await getShips();

const baseSystemSymbol = "X1-DF55";

const waypoints = await getSystemWaypoits(baseSystemSymbol);

if (true) {
  myShipsAll.map(async ({ symbol }) => {
    while (true) {
      const ship = await getShip(symbol);

      if (ship.nav.status === "IN_TRANSIT") {
        await inTransitProcedure(ship);
        continue;
      }

      if (
        ![asteroidFieldLocationSymbol, contractLocationSymbol].includes(
          ship.nav.waypointSymbol
        )
      ) {
        await navigate(ship.symbol, asteroidFieldLocationSymbol);
      }

      const contractItemQuantity = getInventoryQuantity(ship, contractItem);

      if (ship.nav.waypointSymbol === contractLocationSymbol) {
        await dock(ship);
        await refuel(symbol);

        if (contractItemQuantity > 0) {
          await deliverContract(
            contractId,
            symbol,
            contractItem,
            contractItemQuantity
          );
          continue;
        }

        if (contractItemQuantity === 0) {
          await navigate(symbol, asteroidFieldLocationSymbol);
        }

        continue;
      }

      const full = ship.cargo.capacity === ship.cargo.units;

      if (ship.nav.waypointSymbol === asteroidFieldLocationSymbol) {
        if (!full) {
          await extractTillFullProcedure(symbol);
        }

        if (full) {
          await dock(ship);
          await refuel(symbol);

          if (contractItemQuantity > 0) {
            await navigate(symbol, contractLocationSymbol);
          }

          if (contractItemQuantity === 0) {
            const marketplaces = await getMarketInfo(waypoints);

            const invOverlaps = findMarketsForItems(
              ship.cargo.inventory,
              marketplaces
            );

            const marketsToGo = Object.keys(invOverlaps);

            for (let marketSymbol of marketsToGo) {
              await navigate(ship.symbol, marketSymbol);
              for (let itemToSell of invOverlaps[marketSymbol]) {
                const units = getInventoryQuantity(ship, itemToSell);
                await sell(ship, units, itemToSell);
              }
            }

            await navigate(symbol, asteroidFieldLocationSymbol);
            // await sellAllProcedure(shipStatus);
          }
        }
        continue;
      }
    }
  });
}
