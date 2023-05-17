import { type Good } from './Good.js'

export interface Cargo {
  capacity: number
  units: number
  inventory: InventoryGood[]
}

export interface InventoryGood extends Good {
  units: number
}
