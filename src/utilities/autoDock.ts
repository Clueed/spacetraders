import { Ship } from "../types/Ship.js";
import { _dock } from "../api/apiCalls.js";
import { info } from "console";
import { i } from "../util.js";

export async function autoDock(ship: Ship) {
  try {
    const response = await _dock(ship.symbol);
    if (response.status === 200) {
      info(i(ship), "Docked");
      return;
    } else {
      throw new Error("AutoDock failed");
    }
  } catch (error) {
    throw error;
  }
}
