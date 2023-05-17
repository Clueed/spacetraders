import { TradeSymbol } from "./Good.js";

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
