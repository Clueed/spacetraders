import { TradeSymbol } from "./types/Good.js";
import { Marketplace, MarketGood } from "./types/Marketplace.js";
import fs from "fs";
import { Quote } from "./util.js";

class TotalMarketStorage {
  private readonly filePath: string = "marketRegistry.json";

  MarketRegistry: {
    [symbol: string]: {
      timestamp: number;
      marketplace: Marketplace;
    }[];
  } = {};

  constructor() {
    this.loadRegistryFromFile();
  }

  private loadRegistryFromFile(): void {
    try {
      const data = fs.readFileSync(this.filePath, "utf8");
      this.MarketRegistry = JSON.parse(data);
    } catch (error) {
      console.log(`Error loading market registry from file: ${error}`);
    }
  }

  saveRegistryToFile(): void {
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.MarketRegistry),
        "utf8"
      );
    } catch (error) {
      console.log(`Error saving market registry to file: ${error}`);
    }
  }
}

export class TotalMarket extends TotalMarketStorage {
  constructor() {
    super();
  }

  public addMarketRecord(marketplace: Marketplace): void {
    if (marketplace.tradeGoods) {
      if (!this.MarketRegistry[marketplace.symbol]) {
        this.MarketRegistry[marketplace.symbol] = [];
      }

      this.MarketRegistry[marketplace.symbol].push({
        timestamp: Date.now(),
        marketplace: marketplace,
      });
      this.saveRegistryToFile();
    } else {
      throw new Error("Only markets with trade goods can be recorded.");
    }
  }

  private lastRecords() {
    let lastRecords: Marketplace[] = [];

    for (let marketSymbol of Object.keys(this.MarketRegistry)) {
      const lastRecord = this.MarketRegistry[marketSymbol][0];
      lastRecords.push(lastRecord.marketplace);
    }

    return lastRecords;
  }

  public uniqueItemSymbols() {
    //let uniqueSymbols: TradeSymbol[] = [];

    let uniqueSymbols: Set<TradeSymbol> = new Set();

    for (let marketplace of this.lastRecords()) {
      for (let tradeGood of marketplace.tradeGoods!) {
        uniqueSymbols.add(tradeGood.symbol);
      }
    }

    return Array.from(uniqueSymbols);
  }

  public getPrices(tradeSymbol: TradeSymbol) {
    let options: { marketplace: Marketplace; tradeGood: MarketGood }[] = [];

    for (let marketplace of this.lastRecords()) {
      for (let tradeGood of marketplace.tradeGoods!) {
        if (tradeGood.symbol === tradeSymbol) {
          options.push({
            marketplace: marketplace,
            tradeGood: tradeGood,
          });
        }
      }
    }

    if (options) {
      return options;
    }

    return [];
  }

  public getBestPrice(
    tradeSymbol: TradeSymbol,
    type: "BID" | "ASK"
  ): Quote | null {
    let options;

    try {
      options = this.getPrices(tradeSymbol);

      if (options.length === 0) {
        return null;
      }
    } catch (error) {
      console.log("error :>> ", error);
      return null;
    }

    let bestPrice: number | undefined;
    let bestPriceIndex: number | undefined;

    for (let i = 0; i < options.length; i++) {
      const tradeGood = options[i].tradeGood;

      if (type === "BID" && tradeGood.purchasePrice < (bestPrice ?? Infinity)) {
        bestPrice = tradeGood.purchasePrice;
        bestPriceIndex = i;
      }

      if (type === "ASK" && tradeGood.sellPrice > (bestPrice ?? -Infinity)) {
        bestPrice = tradeGood.sellPrice;
        bestPriceIndex = i;
      }
    }

    return {
      type: type,
      price: bestPrice!,
      marketplace: options[bestPriceIndex!].marketplace,
    };
  }
}

export const totalMarket = new TotalMarket();
