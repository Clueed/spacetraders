import { type Good, type TradeSymbol } from './Good.js'
import { type Transaction } from './Transaction.js'

export interface Marketplace {
  symbol: string
  exports: Good[]
  imports: Good[]
  exchange: Good[]
  transactions?: Transaction[]
  tradeGoods?: MarketGood[]
}

export interface MarketGood {
  symbol: TradeSymbol
  tradeVolume: number
  supply: 'SCARCE' | 'LIMITED' | 'MODERATE' | 'ABUNDANT'
  purchasePrice: number
  sellPrice: number
}
