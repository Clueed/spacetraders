import { Ship } from "../types/Ship.js";
import { getMarketplace, navigate } from "../api/apiCalls.js";
import { buy, sell } from "../utilities/trade/buySell.js";
import { info } from "console";
import {
  Arbitrage,
  logInfo,
  getShip,
  getMarketGood,
  i,
  getInventoryQuantity,
} from "../util.js";
import { autoDock } from "../utilities/autoDock.js";
import { autoRefuel } from "../utilities/autoRefuel.js";

export async function runArbitrage(arbitrage: Arbitrage, ship: Ship) {
  logInfo(ship, `Running ${arbitrage.symbol} arbitrage.`);

  const approxPnL = arbitrage.spread * ship.cargo.capacity;

  logInfo(ship, `Estimating profit before fuel of ${approxPnL} per run.`);

  for (let trade of ["BUY", "SELL"]) {
    await navigate(
      ship.symbol,
      trade === "BUY"
        ? arbitrage.ask.marketplace.symbol
        : arbitrage.bid.marketplace.symbol
    );

    ship = await getShip(ship.symbol);

    const currentMarket = await getMarketplace(
      ship.nav.systemSymbol,
      ship.nav.waypointSymbol
    );

    await autoRefuel(currentMarket, ship);

    const arbitrageGood = getMarketGood(currentMarket, arbitrage.symbol);

    if (!arbitrageGood) {
      throw new Error("Arbitrage good no longer available here.");
      // TODO:
      // If can't purchase return
      // If can't sell, pick next best price even at loss.
    }

    const slippage =
      trade === "BUY"
        ? arbitrageGood.purchasePrice - arbitrage.ask.price
        : arbitrageGood.sellPrice - arbitrage.bid.price;

    if (slippage !== 0) {
      info(
        i(ship),
        `${arbitrage.symbol} ${
          trade === "BUY" ? "ask" : "bid"
        } slipped by ${slippage}.`
      );
      console.info(i(ship), `Canceling arbitrage execution. Reevaluating.`);
      return;
    }

    await autoDock(ship);

    if (trade === "BUY") {
      const inventoryCapacity = ship.cargo.capacity - ship.cargo.units;

      const response = await buy(ship, inventoryCapacity, arbitrage.symbol);
    }

    if (trade === "SELL") {
      const amount = getInventoryQuantity(ship, arbitrage.symbol);
      const response = await sell(ship, amount, arbitrage.symbol);
    }
  }
  return;
}
