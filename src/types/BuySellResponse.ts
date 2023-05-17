import { type Agent } from './Agent.js'
import { type Cargo } from './Cargo.js'
import { type Transaction } from './Transaction.js'

export interface BuySellResponse {
  agent: Agent
  cargo: Cargo
  transaction: Transaction
}
