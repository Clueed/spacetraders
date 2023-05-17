import { Good, TradeSymbol } from "./Good.js";
import { Transaction } from "./Transaction.js";

export interface Marketplace {
  symbol: string;
  exports: Good[];
  imports: Good[];
  exchange: Good[];
  transactions?: Transaction[];
  tradeGoods?: MarketGood[];
}

export interface MarketGood {
  symbol: TradeSymbol;
  tradeVolume: number;
  supply: "SCARCE" | "LIMITED" | "MODERATE" | "ABUNDANT";
  purchasePrice: number;
  sellPrice: number;
}
