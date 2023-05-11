import { TradeSymbol } from "./TradeSymbols.js";

export interface Marketplace {
  symbol: string;
  exports: Export[];
  imports: Import[];
  exchange: Exchange[];
  transactions: Transaction[];
  tradeGoods: TradeGood[];
}

export interface Export {
  symbol: TradeSymbol;
  name: string;
  description: string;
}

export interface Import {
  symbol: TradeSymbol;
  name: string;
  description: string;
}

export interface Exchange {
  symbol: TradeSymbol;
  name: string;
  description: string;
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

export interface TradeGood {
  symbol: TradeSymbol;
  tradeVolume: number;
  supply: "SCARCE" | "LIMITED" | "MODERATE" | "ABUNDANT";
  purchasePrice: number;
  sellPrice: number;
}
