import { type Trait } from './Trait.js'

export interface Waypoint {
  systemSymbol: string
  symbol: string
  type: string
  x: number
  y: number
  orbitals: any[]
  traits: Trait[]
  chart: Chart
  faction: Faction
}

export interface Chart {
  submittedBy: string
  submittedOn: Date
}

export interface Faction {
  symbol: string
}
