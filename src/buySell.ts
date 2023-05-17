import { Ship } from "./types/Ship.js";
import { TradeSymbol } from "./types/Good.js";
import { _sell, _buy } from "./apiCalls.js";
import { isAxiosError } from "axios";
import { BuySellResponse } from "./types/BuySellResponse.js";
import { info } from "console";
import { i } from "./util.js";

export async function sell(
  ship: Ship,
  units: number,
  tradeSymbol: TradeSymbol
): Promise<BuySellResponse> {
  console.log(`${ship.symbol}: Initializing sale`);

  let response: BuySellResponse;

  try {
    response = await _sell(ship.symbol, units, tradeSymbol);
  } catch (error) {
    if (
      isAxiosError(error) &&
      error?.response?.status === 400 &&
      error?.response?.data?.error?.code === 4602
    ) {
      // Not availbale in inventory?
      console.error(
        `${ship.symbol}: SALE FAILED - Item ${tradeSymbol} not available.`
      );
    }
    throw error;
  }

  const { type, pricePerUnit, totalPrice } = response.transaction;

  info(i(ship), `${type} transaction successfull`);
  info(
    `${units}x ${tradeSymbol} * ${pricePerUnit} = ${
      type === "SELL" ? "+" : "-"
    }${totalPrice}`
  );

  return response;
}

export async function buy(
  ship: Ship,
  units: number,
  tradeSymbol: TradeSymbol
): Promise<BuySellResponse> {
  console.log(`${ship.symbol}: Initializing purchase`);

  let response: BuySellResponse;

  try {
    response = await _buy(ship.symbol, tradeSymbol, units);
  } catch (error) {
    throw error;
  }

  const { type, pricePerUnit, totalPrice } = response.transaction;

  info(i(ship), `${type} transaction successfull`);
  info(
    `${units}x ${tradeSymbol} * ${pricePerUnit} = ${
      type === "SELL" ? "+" : "-"
    }${totalPrice}`
  );

  return response;
}
