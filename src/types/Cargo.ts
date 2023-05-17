import { Good } from "./Good.js";

export type Cargo = {
  capacity: number;
  units: number;
  inventory: InventoryGood[];
};

export interface InventoryGood extends Good {
  units: number;
}
