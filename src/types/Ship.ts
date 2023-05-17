import { type Cargo } from './Cargo.js'

export interface Ship {
  symbol: string
  nav: Nav
  crew: Crew
  fuel: Fuel
  frame: Frame
  reactor: Reactor
  engine: Engine
  modules: Module[]
  mounts: Mount[]
  registration: Registration
  cargo: Cargo
}

export interface Crew {
  current: number
  capacity: number
  required: number
  rotation: string
  morale: number
  wages: number
}

export interface Engine {
  symbol: string
  name: string
  description: string
  condition: number
  speed: number
  requirements: EngineRequirements
}

export interface EngineRequirements {
  power: number
  crew: number
}

export interface Frame {
  symbol: string
  name: string
  description: string
  moduleSlots: number
  mountingPoints: number
  fuelCapacity: number
  condition: number
  requirements: EngineRequirements
}

export interface Fuel {
  current: number
  capacity: number
  consumed: Consumed
}

export interface Consumed {
  amount: number
  timestamp: Date
}

export interface Module {
  symbol: string
  name: string
  description: string
  capacity?: number
  requirements: ModuleRequirements
  range?: number
}

export interface ModuleRequirements {
  crew: number
  power: number
  slots: number
}

export interface Mount {
  symbol: string
  name: string
  description: string
  strength: number
  requirements: EngineRequirements
  deposits?: string[]
}

export interface Nav {
  systemSymbol: string
  waypointSymbol: string
  route: Route
  status: 'IN_TRANSIT' | 'IN_ORBIT' | 'DOCKED'
  flightMode: string
}

export interface Route {
  departure: NavWaypoint
  destination: NavWaypoint
  arrival: Date
  departureTime: Date
}

export interface NavWaypoint {
  symbol: string
  type:
  | 'PLANET'
  | 'GAS_GIANT'
  | 'MOON'
  | 'ORBITAL_STATION'
  | 'JUMP_GATE'
  | 'ASTEROID_FIELD'
  | 'NEBULA'
  | 'DEBRIS_FIELD'
  | 'GRAVITY_WELL'
  systemSymbol: string
  x: number
  y: number
}

export interface Reactor {
  symbol: string
  name: string
  description: string
  condition: number
  powerOutput: number
  requirements: ReactorRequirements
}

export interface ReactorRequirements {
  crew: number
}

export interface Registration {
  name: string
  factionSymbol: string
  role: string
}
