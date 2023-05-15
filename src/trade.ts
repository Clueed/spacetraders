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
  sell,
} from "./util.js";
import { TotalMarket } from "./TotalMarket.js";

const totalmarket = new TotalMarket();

const unique = totalmarket.uniqueItemSymbols();

const arbitrage = checkArbitrage(totalmarket, unique);

const groupedArbitrage = groupArbitrages(arbitrage);

console.log("arbitrage :>> ", groupedArbitrage);

const contractItem: TradeSymbol = "ALUMINUM_ORE";
const asteroidFieldLocationSymbol = "X1-DF55-17335A";
const contractId = "clheig9zm4i5ls60ddxtdkirp";
const contractLocationSymbol = "X1-DF55-20250Z";

const myShipsAll = await getShips();

const baseSystemSymbol = "X1-ZA40"; //"X1-DF55";
const waypoints = await getSystemWaypoits(baseSystemSymbol);
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

console.log("totalmarket :>> ", totalmarket);

if (false) {
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

            const marketItemUnion = findMarketsForItems(
              marketplaces,
              ship.cargo.inventory
            );

            const selectedMarkets = selectMarketCombination(marketItemUnion);

            console.log("selectedMarkets :>> ", selectedMarkets);

            let selectedWaypoints = [];
            for (let market of selectedMarkets) {
              for (let waypoint of waypoints) {
                if (market.symbol === waypoint.symbol) {
                  selectedWaypoints.push(waypoint);
                }
              }
            }

            const sortedWaypoints: Waypoint[] = quicksort(selectedWaypoints);

            for (let wp of sortedWaypoints) {
              if (ship.nav.waypointSymbol !== wp.symbol) {
                await navigate(ship.symbol, wp.symbol);
              }

              const market = marketItemUnion.findLast(
                (miu) => miu.marketplace.symbol === wp.symbol
              );

              if (market) {
                const availableGoods = market.availableGoods;
                for (let itemToSell of availableGoods) {
                  await sell(ship, itemToSell.units, itemToSell.symbol);
                }
              } else {
                throw new Error("Something went wrong");
              }
            }

            const update = await getShip(ship.symbol);
            console.log(`${ship}: Cargo after roundtrip`);
            for (let item of update.cargo.inventory) {
              console.log(item.symbol, item.units);
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
