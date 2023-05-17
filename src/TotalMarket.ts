import { type TradeSymbol } from './types/Good.js'
import { type Marketplace, type MarketGood } from './types/Marketplace.js'
import fs from 'fs'
import { type Quote } from './util.js'

class TotalMarketStorage {
  private readonly filePath: string = 'marketRegistry.json'

  MarketRegistry: Record<string, Array<{
    timestamp: number
    marketplace: Marketplace
  }>> = {}

  constructor () {
    this.loadRegistryFromFile()
  }

  private loadRegistryFromFile (): void {
    console.debug('TotalMarketStorage: Loading market registry from file.')

    try {
      const data = fs.readFileSync(this.filePath, 'utf8')
      this.MarketRegistry = JSON.parse(data)
    } catch (error) {
      console.log(`Error loading market registry from file: ${error}`)
    }

    const entryCount = Object.keys(this.MarketRegistry).map((key) => this.MarketRegistry[key].length).reduce((a, b) => a + b)
    console.debug(`TotalMarketStorage: ${entryCount} entries have been recoded.`)
  }

  saveRegistryToFile (): void {
    console.debug('TotalMarketStorage: Saving market registry to file.')
    const entryCount = Object.keys(this.MarketRegistry).map((key) => this.MarketRegistry[key].length).reduce((a, b) => a + b)
    console.debug(`TotalMarketStorage: ${entryCount} entries have been recoded.`)
    try {
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.MarketRegistry),
        'utf8'
      )
    } catch (error) {
      console.log(`Error saving market registry to file: ${error}`)
    }
  }
}

export class TotalMarket extends TotalMarketStorage {
  public addMarketRecord (marketplace: Marketplace): void {
    if (marketplace.tradeGoods !== undefined) {
      if (!Object.keys(this.MarketRegistry).includes(marketplace.symbol)) {
        this.MarketRegistry[marketplace.symbol] = []
      }

      this.MarketRegistry[marketplace.symbol].push({
        timestamp: Date.now(),
        marketplace
      })
      this.saveRegistryToFile()

      const marketSymbol = marketplace.symbol
      console.debug(`TotalMarketStorage: Added market entry for ${marketSymbol}`)

      const entryCount = Object.keys(this.MarketRegistry).map((key) => this.MarketRegistry[key].length).reduce((a, b) => a + b)
      console.debug(`TotalMarketStorage: ${entryCount} entries have been recoded.`)
    } else {
      throw new Error('Only markets with trade goods can be recorded.')
    }
  }

  private lastRecords (): Marketplace[] {
    const lastRecords: Marketplace[] = []

    for (const marketSymbol of Object.keys(this.MarketRegistry)) {
      const lastIndex = this.MarketRegistry[marketSymbol].length - 1
      const lastRecord = this.MarketRegistry[marketSymbol][lastIndex]
      lastRecords.push(lastRecord.marketplace)
    }

    return lastRecords
  }

  public uniqueItemSymbols (): TradeSymbol[] {
    const uniqueSymbols = new Set<TradeSymbol>()

    for (const marketplace of this.lastRecords()) {
      for (const tradeGood of marketplace.tradeGoods!) {
        uniqueSymbols.add(tradeGood.symbol)
      }
    }

    return Array.from(uniqueSymbols)
  }

  public getPrices (tradeSymbol: TradeSymbol): Array<{ marketplace: Marketplace, tradeGood: MarketGood }> | [] {
    const options = []

    for (const marketplace of this.lastRecords()) {
      for (const tradeGood of marketplace.tradeGoods!) {
        if (tradeGood.symbol === tradeSymbol) {
          options.push({
            marketplace,
            tradeGood
          })
        }
      }
    }

    if (options.length !== 0) {
      return options
    }

    return options || []
  }

  public getBestPrice (
    tradeSymbol: TradeSymbol,
    type: 'BID' | 'ASK'
  ): Quote | null {
    let options

    try {
      options = this.getPrices(tradeSymbol)

      if (options.length === 0) {
        return null
      }
    } catch (error) {
      console.log('error :>> ', error)
      return null
    }

    let bestPrice: number | undefined
    let bestPriceIndex: number | undefined

    for (let i = 0; i < options.length; i++) {
      const tradeGood = options[i].tradeGood

      if (type === 'ASK' && tradeGood.purchasePrice < (bestPrice ?? Infinity)) {
        bestPrice = tradeGood.purchasePrice
        bestPriceIndex = i
      }

      if (type === 'BID' && tradeGood.sellPrice > (bestPrice ?? -Infinity)) {
        bestPrice = tradeGood.sellPrice
        bestPriceIndex = i
      }
    }

    return {
      type,
      price: bestPrice!,
      marketplace: options[bestPriceIndex!].marketplace,
      symbol: tradeSymbol
    }
  }
}

export const totalMarket = new TotalMarket()
