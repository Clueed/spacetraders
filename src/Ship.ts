import { TradeSymbol } from "./TradeSymbols.js";

export interface Ship {
  symbol: string;
  nav: Nav;
  crew: Crew;
  fuel: Fuel;
  frame: Frame;
  reactor: Reactor;
  engine: Engine;
  modules: Module[];
  mounts: Mount[];
  registration: Registration;
  cargo: Cargo;
}

export type Cargo = {
  capacity: number;
  units: number;
  inventory: Inventory[];
};

export type Inventory = {
  symbol: TradeSymbol;
  name: string;
  description: string;
  units: number;
};

export type Crew = {
  current: number;
  capacity: number;
  required: number;
  rotation: string;
  morale: number;
  wages: number;
};

export type Engine = {
  symbol: string;
  name: string;
  description: string;
  condition: number;
  speed: number;
  requirements: EngineRequirements;
};

export type EngineRequirements = {
  power: number;
  crew: number;
};

export type Frame = {
  symbol: string;
  name: string;
  description: string;
  moduleSlots: number;
  mountingPoints: number;
  fuelCapacity: number;
  condition: number;
  requirements: EngineRequirements;
};

export type Fuel = {
  current: number;
  capacity: number;
  consumed: Consumed;
};

export type Consumed = {
  amount: number;
  timestamp: Date;
};

export type Module = {
  symbol: string;
  name: string;
  description: string;
  capacity?: number;
  requirements: ModuleRequirements;
  range?: number;
};

export type ModuleRequirements = {
  crew: number;
  power: number;
  slots: number;
};

export type Mount = {
  symbol: string;
  name: string;
  description: string;
  strength: number;
  requirements: EngineRequirements;
  deposits?: string[];
};

export type Nav = {
  systemSymbol: string;
  waypointSymbol: string;
  route: Route;
  status: string;
  flightMode: string;
};

export type Route = {
  departure: Departure;
  destination: Departure;
  arrival: Date;
  departureTime: Date;
};

export type Departure = {
  symbol: string;
  type: string;
  systemSymbol: string;
  x: number;
  y: number;
};

export type Reactor = {
  symbol: string;
  name: string;
  description: string;
  condition: number;
  powerOutput: number;
  requirements: ReactorRequirements;
};

export type ReactorRequirements = {
  crew: number;
};

export type Registration = {
  name: string;
  factionSymbol: string;
  role: string;
};
