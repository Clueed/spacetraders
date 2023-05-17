import {
  dock,
  getMarketplace,
  getShips,
  getWaypoint,
  navigate
} from './api/apiCalls.js'
import { sell } from './utilities/trade/buySell.js'
import {
  type Quote,
  checkArbitrage,
  getInventoryQuantity,
  getShip,
  i
} from './util.js'
import { autoRefuel } from './utilities/autoRefuel.js'
import { runArbitrage } from './procedures/runArbitrage.js'
import { info } from 'console'
import { totalMarket } from './TotalMarket.js'
import { quicksort } from './findOptimalMarketplaceCombinations.js'
import { type Waypoint } from './types/Waypoint.js'

const unique = totalMarket.uniqueItemSymbols()

const uniqueWithoutFuel = unique.filter(
  (tradeSymbol) => tradeSymbol !== 'FUEL'
)

const arbitrage = checkArbitrage(totalMarket, uniqueWithoutFuel)

const myShips = await getShips()

while (true) {
  for (let ship of myShips) {
    let empty = ship.cargo.units === 0
    ship = await getShip(ship.symbol)
    empty = ship.cargo.units === 0
    while (!empty) {
      const items = ship.cargo.inventory
        .map((inventoryGood) => inventoryGood.symbol)
        .toString()
      info(i(ship), `Detected items in inventory: ${items}`)
      info(i(ship), 'Initiating inventory sell-off procedure.')

      const sellingRoute: Waypoint[] = []

      const sellingItems: Record<string, Quote[]> = {}

      for (const tradeItems of ship.cargo.inventory) {
        const quote = totalMarket.getBestPrice(tradeItems.symbol, 'BID')
        if (quote != null) {
          const waypointSymbol = quote.marketplace.symbol
          const waypoint = await getWaypoint(waypointSymbol)

          sellingRoute.push(waypoint)

          if (Object.keys(sellingItems).includes(waypointSymbol)) {
            sellingItems[waypointSymbol].push(quote)
          } else {
            sellingItems[waypointSymbol] = [quote]
          }
        }
      }

      const optimizedRoute = quicksort(sellingRoute)

      info(i(ship), 'Found optimal route for sell-off.')
      info(i(ship), 'Executing sell-off.')

      if (ship.nav.waypointSymbol === optimizedRoute[0].symbol) {
        for (const quote of sellingItems[optimizedRoute[0].symbol]) {
          const amount = getInventoryQuantity(ship, quote.symbol)
          await dock(ship.symbol)
          await sell(ship, amount, quote.symbol)
        }
      } else {
        await navigate(ship.symbol, optimizedRoute[0].symbol)
        const currentMarket = await getMarketplace(
          optimizedRoute[0].systemSymbol,
          optimizedRoute[0].symbol
        )
        await autoRefuel(currentMarket, ship)
      }

      ship = await getShip(ship.symbol)
      empty = ship.cargo.units === 0
    }

    await runArbitrage(arbitrage[0], ship)
  }
}
