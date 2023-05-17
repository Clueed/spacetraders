import { Ship } from "../types/Ship.js";
import { refuel } from "../api/apiCalls.js";
import { Marketplace } from "../types/Marketplace.js";
import { totalMarket } from "../TotalMarket.js";
import { getMarketGood } from "../util.js";
import { autoDock } from "./autoDock.js";

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
