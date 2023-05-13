import { Good, TradeSymbol } from "./Good.js";

export interface Marketplace {
  symbol: string;
  exports: Good[];
  imports: Good[];
  exchange: Good[];
  transactions?: Transaction[];
  tradeGoods?: MarketGood[];
}

export interface Transaction {
  waypointSymbol: string;
  shipSymbol: string;
  tradeSymbol: TradeSymbol;
  type: "PURCHASE" | "SELL";
  units: number;
  pricePerUnit: number;
  totalPrice: number;
  timestamp: string;
}

export interface MarketGood {
  symbol: TradeSymbol;
  tradeVolume: number;
  supply: "SCARCE" | "LIMITED" | "MODERATE" | "ABUNDANT";
  purchasePrice: number;
  sellPrice: number;
}
