import { info } from 'console'
import { extract } from '../api/apiCalls.js'
import { type Ship } from '../types/Ship.js'
import { i, sleep } from '../util.js'

export async function extractTillFullProcedure (
  shipSymbol: string
): Promise<void> {
  while (true) {
    try {
      const extractionStatus = await extract(shipSymbol)
      if (extractionStatus.full) {
        break
      }
      if (extractionStatus.cooldown > 0) {
        await sleep(extractionStatus.cooldown)
      }
    } catch (error) {
      console.error(error)
      break
    }
  }
}

export async function inTransitProcedure (ship: Ship): Promise<void> {
  const arrivalDate = new Date(ship.nav.route.arrival)
  const deltaEta = arrivalDate.getTime() - new Date().getTime()
  const deltaEtaDate = new Date(deltaEta)

  const [etaMinutes, etaSeconds] = [
    deltaEtaDate.getMinutes(),
    deltaEtaDate.getSeconds()
  ]
  const { type, symbol } = ship.nav.route.destination
  info(
    i(ship), `In transit to ${type} ${symbol}. ETA: T-${etaMinutes}:${etaSeconds}`
  )

  await sleep(deltaEta)
}
