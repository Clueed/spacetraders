import { type Good } from './types/Good.js'
import { type Marketplace, type MarketGood } from './types/Marketplace.js'
import { type InventoryGood } from './types/Cargo.js'

export interface MarketInventoryUnion {
  marketplace: Marketplace
  availableGoods: InventoryGood[]
}

export function findMarketsForItems (
  marketplaces: Marketplace[],
  inventory: InventoryGood[]
): MarketInventoryUnion[] | [] {
  const marketInvenstoryOverlap = []

  for (const marketplace of marketplaces) {
    const availableGoods: InventoryGood[] = []
    let marketplaceItems: Good[] | MarketGood[]

    if (marketplace.tradeGoods != null) {
      // Tradegoods are only visible when a ship is in orbit around that market
      // Tradegoods also contain prices
      marketplaceItems = marketplace.tradeGoods
    } else {
      marketplaceItems = [...marketplace.exchange, ...marketplace.imports]
    }

    for (const marketplaceItem of marketplaceItems) {
      for (const inventoryItem of inventory) {
        if (marketplaceItem.symbol === inventoryItem.symbol) {
          availableGoods.push(inventoryItem)
        }
      }
    }

    if (availableGoods.length !== 0) {
      marketInvenstoryOverlap.push({
        marketplace,
        availableGoods
      })
    }
  }

  return marketInvenstoryOverlap
}
