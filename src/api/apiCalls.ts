import axios, { isAxiosError, type AxiosResponse } from 'axios'
import { totalMarket } from '../TotalMarket.js'
import { type BuySellResponse } from '../types/BuySellResponse.js'
import { type TradeSymbol } from '../types/Good.js'
import { type Marketplace } from '../types/Marketplace.js'
import { type Ship } from '../types/Ship.js'
import { type Waypoint } from '../types/Waypoint.js'
import { sleep } from '../util.js'
import { apiQueueWrapper } from './queueWrapper.js'

export async function getShips (): Promise<Ship[]> {
  const response = await apiQueueWrapper('GET', 'my/ships')

  if (response?.status === 200) {
    return response.data.data
  } else {
    console.error(response)
    return response.data.data
  }
}

export async function dock (
  shipSymbol: string
): Promise<AxiosResponse<any, any>> {
  return await apiQueueWrapper('POST', `my/ships/${shipSymbol}/dock`)
}

export async function _navigate (
  shipSymbol: string,
  waypointSymbol: string
): Promise<AxiosResponse> {
  return await apiQueueWrapper('POST', `my/ships/${shipSymbol}/navigate`, {
    waypointSymbol
  })
}

export async function navigate (
  shipSymbol: string,
  waypointSymbol: string
): Promise<void> {
  console.log(`${shipSymbol}: Initializing navigation to ${waypointSymbol}...`)

  try {
    const response = await _navigate(shipSymbol, waypointSymbol)

    if (response.status === 200) {
      const arrivalDate = new Date(response.data.data.nav.route.arrival)

      const deltaEta = arrivalDate.getTime() - new Date().getTime()

      const deltaEtaDate = new Date(deltaEta)
      const [etaMinunte, etaSeconds] = [
        deltaEtaDate.getMinutes(),
        deltaEtaDate.getSeconds()
      ]

      const destination = response.data.data.nav.route.destination
      const departure = response.data.data.nav.route.departure

      console.log(
        `${shipSymbol} @ ${destination.symbol}: Departing for ${destination.type} ${departure.symbol}. EAT: T-${etaMinunte}:${etaSeconds}`
      )

      if (deltaEta > 0) {
        await sleep(deltaEta)
        console.log(`${shipSymbol}: Arrived at ${waypointSymbol}`)
      }
    }
  } catch (error) {
    if (
      isAxiosError(error) &&
      error.response?.status === 400 &&
      error.response?.data?.error?.code === 4204
    ) {
      // Ship already there
      console.log(
        `${shipSymbol}: Cancel navigation, ship is already at ${waypointSymbol}...`
      )
      return
    }
    console.error(
      `${shipSymbol}: FAILED TO INITIALIZE NAVIGATION TO ${waypointSymbol}`
    )
    console.error(error)
  }
}

export async function extract (
  shipSymbol: string
): Promise<{ cooldown: number, full: boolean }> {
  console.log(`${shipSymbol}: Initializing extraction...`)

  let cooldown: number = 0
  let full: boolean = false

  try {
    const response = await apiQueueWrapper(
      'POST',
      `my/ships/${shipSymbol}/extract`
    )

    if (response.status === 201) {
      const data = response.data.data
      console.log(
        `${data.extraction.shipSymbol} extracted ${data.extraction.yield.units}x ${data.extraction.yield.symbol}`
      )
      cooldown = parseInt(data.cooldown.remainingSeconds) * 1000
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response?.status === 400) {
      console.log(`${shipSymbol}: At max capacity.`)
      full = true
    } else {
      console.error(`${shipSymbol}: EXTRACTION FAILED`)
      throw error
    }
  }

  return { cooldown, full }
}

export async function refuel (shipSymbol: string): Promise<void> {
  console.log(`${shipSymbol}: Initializing refueling...`)
  try {
    const response = await apiQueueWrapper(
      'POST',
      `my/ships/${shipSymbol}/refuel`
    )
    if (response.status === 200) {
      console.log(`${shipSymbol}: Refueling complete.`)
    } else {
      console.error(response)
    }
  } catch (error) {
    console.error(`${shipSymbol}: REFUELING FAILED`)
    console.error(error)
  }
}

export async function deliverContract (
  contractId: string,
  shipSymbol: string,
  tradeSymbol: TradeSymbol,
  units: number
): Promise<void> {
  console.log(`${shipSymbol}: Initializing contract delivery...`)
  try {
    const response = await apiQueueWrapper(
      'POST',
      `my/contracts/${contractId}/deliver`,
      {
        shipSymbol,
        tradeSymbol,
        units
      }
    )
    if (response.status === 200) {
      console.log(
        `${shipSymbol} @ ${tradeSymbol}: delivered ${units}x to contract ${contractId}`
      )
    } else {
      console.error(response)
    }
  } catch (error) {
    console.error(`${shipSymbol}: DELIVERY FAILED`)
    console.error(error)
  }
}

export async function _buy (
  shipSymbol: string,
  tradeSymbol: TradeSymbol,
  units: number
): Promise<BuySellResponse> {
  const response = await apiQueueWrapper(
    'POST',
      `my/ships/${shipSymbol}/purchase`,
      {
        units,
        symbol: tradeSymbol
      }
  )

  return response.data.data
}

export async function _sell (
  shipSymbol: string,
  units: number,
  tradeSymbol: TradeSymbol
): Promise<BuySellResponse> {
  const response = await apiQueueWrapper('POST', `my/ships/${shipSymbol}/sell`, {
    symbol: tradeSymbol,
    units
  })

  return response.data.data
}

export function getSystemSymbolFromWaypointSymbol (
  waypointSymbol: string
): string {
  const [galaxy, system] = waypointSymbol.split('-')
  return galaxy + '-' + system
}

export async function getWaypoint (waypointSymbol: string): Promise<Waypoint> {
  const systemSymbol = getSystemSymbolFromWaypointSymbol(waypointSymbol)

  const response = await apiQueueWrapper(
    'GET',
      `systems/${systemSymbol}/waypoints/${waypointSymbol}`
  )
  return response.data.data
}

export async function getSystemWaypoits (
  systemSymbol: string
): Promise<Waypoint[]> {
  const waypoints = []
  let page = 1

  while (true) {
    try {
      const response = await apiQueueWrapper(
        'GET',
        `systems/${systemSymbol}/waypoints?page=${page}&limit=20`
      )

      if (response.data.data.length === 0) {
        break
      }

      waypoints.push(...response.data.data)
    } catch (error) {
      console.error(error)
    }

    page++
  }

  return waypoints
}

export async function getMarketplace (
  systemSymbol: string,
  waypointSymbol: string
): Promise<Marketplace> {
  const response = await apiQueueWrapper(
    'GET',
      `systems/${systemSymbol}/waypoints/${waypointSymbol}/market`
  )
  const marketplace: Marketplace = response.data.data

  totalMarket.addMarketRecord(marketplace)

  return marketplace
}
