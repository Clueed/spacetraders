import { MarketInventoryUnion } from "./findMarketsForItems.js";
import { Marketplace } from "./types/Marketplace.js";
import { InventoryGood } from "./types/Ship.js";
import { Waypoint } from "./types/Waypoint.js";

export function selectMarketCombination(
  marketInventoryUnion: MarketInventoryUnion[]
) {
  // create a set of all the available items across all marketplaces
  const allItems = new Set<InventoryGood>();
  for (let market of marketInventoryUnion) {
    for (let item of market.availableGoods) {
      allItems.add(item);
    }
  }

  // create a map that tracks which marketplaces have each item
  const itemToMarketMap = new Map<InventoryGood, Set<Marketplace>>();
  for (const item of allItems) {
    itemToMarketMap.set(item, new Set<Marketplace>());
    for (const market of marketInventoryUnion) {
      if (market.availableGoods.includes(item)) {
        itemToMarketMap.get(item)!.add(market.marketplace);
      }
    }
  }

  // sort the items by the number of marketplaces that have them (in ascending order)
  const sortedItems = Array.from(allItems).sort(
    (a, b) => itemToMarketMap.get(a)!.size - itemToMarketMap.get(b)!.size
  );

  // create a set of marketplaces to include in the final combination
  const selectedMarkets = new Set<Marketplace>();
  for (const item of sortedItems) {
    // add the first marketplace that has this item (if any)
    for (const market of itemToMarketMap.get(item)!) {
      if (!selectedMarkets.has(market)) {
        selectedMarkets.add(market);
        break;
      }
    }
  }

  // convert the set to an array and return it
  return Array.from(selectedMarkets);
}

function getDistance(a: Waypoint, b: Waypoint): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// using quicksort (recursive implementation)
export function quicksort(arr: Waypoint[]): Waypoint[] {
  if (arr.length <= 1) {
    return arr;
  }

  const pivot = arr[Math.floor(arr.length / 2)];
  const less: Waypoint[] = [];
  const equal: Waypoint[] = [];
  const greater: Waypoint[] = [];

  for (const waypoint of arr) {
    const distance = getDistance(waypoint, pivot);
    if (distance < 0) {
      less.push(waypoint);
    } else if (distance > 0) {
      greater.push(waypoint);
    } else {
      equal.push(waypoint);
    }
  }

  return [...quicksort(less), ...equal, ...quicksort(greater)];
}
