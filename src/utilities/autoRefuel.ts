import { type Ship } from '../types/Ship.js'
import { dock, refuel } from '../api/apiCalls.js'
import { type Marketplace } from '../types/Marketplace.js'
import { totalMarket } from '../TotalMarket.js'
import { getMarketGood } from '../util.js'

export async function autoRefuel (
  marketplace: Marketplace,
  ship: Ship,
  maxMarkup: number = 5
): Promise<void> {
  const fuelGood = getMarketGood(marketplace, 'FUEL')
  const bestFuelQuote = totalMarket.getBestPrice('FUEL', 'ASK')

  if ((fuelGood == null) || (bestFuelQuote == null)) {
    return
  }

  const fuelMarkup = Math.floor(
    (fuelGood.purchasePrice / bestFuelQuote.price - 1) * 100
  )

  if (fuelMarkup < maxMarkup) {
    console.info(
      `${ship.symbol} @ ${ship.nav.systemSymbol}: Refuelling at ${fuelMarkup}% markup.`
    )
    await dock(ship)
    await refuel(ship.symbol)
  }
}
