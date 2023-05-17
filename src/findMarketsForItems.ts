import { Good } from "./types/Good.js";
import { Marketplace, MarketGood } from "./types/Marketplace.js";
import { InventoryGood } from "./types/Cargo.js";

export type MarketInventoryUnion = {
  marketplace: Marketplace;
  availableGoods: InventoryGood[];
};

export function findMarketsForItems(
  marketplaces: Marketplace[],
  inventory: InventoryGood[]
): MarketInventoryUnion[] | [] {
  let marketInvenstoryOverlap = [];

  for (let marketplace of marketplaces) {
    let availableGoods: InventoryGood[] = [];
    let marketplaceItems: Good[] | MarketGood[];

    if (marketplace.tradeGoods) {
      // Tradegoods are only visible when a ship is in orbit around that market
      // Tradegoods also contain prices
      marketplaceItems = marketplace.tradeGoods;
    } else {
      marketplaceItems = [...marketplace.exchange, ...marketplace.imports];
    }

    for (let marketplaceItem of marketplaceItems) {
      for (let inventoryItem of inventory) {
        if (marketplaceItem.symbol === inventoryItem.symbol) {
          availableGoods.push(inventoryItem);
        }
      }
    }

    if (availableGoods.length !== 0) {
      marketInvenstoryOverlap.push({
        marketplace,
        availableGoods,
      });
    }
  }

  return marketInvenstoryOverlap;
}
