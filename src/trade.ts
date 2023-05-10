import {
  deliverContract,
  dock,
  getShips,
  navigate,
  refuel,
} from "./apiCalls.js";
import { extractTillFullProcedure, inTransitProcedure } from "./procedures.js";
import { TradeSymbol } from "./types/TradeSymbols.js";
import { getInventoryQuantity, getShip } from "./util.js";

const contractItem: TradeSymbol = "ALUMINUM_ORE";
const asteroidFieldLocationSymbol = "X1-DF55-17335A";
const contractId = "clheig9zm4i5ls60ddxtdkirp";
const contractLocationSymbol = "X1-DF55-20250Z";

const myShipsAll = await getShips();
myShipsAll.map(async (ship) => {
  while (true) {
    const shipStatus = await getShip(ship.symbol);

    if (shipStatus.nav.status === "IN_TRANSIT") {
      await inTransitProcedure(shipStatus);
      continue;
    }

    const contractItemQuantity = getInventoryQuantity(shipStatus, contractItem);

    if (shipStatus.nav.waypointSymbol === contractLocationSymbol) {
      await dock(shipStatus);
      await refuel(ship.symbol);

      if (contractItemQuantity > 0) {
        await deliverContract(
          contractId,
          ship.symbol,
          contractItem,
          contractItemQuantity
        );
        continue;
      }

      if (contractItemQuantity === 0) {
        await navigate(ship.symbol, asteroidFieldLocationSymbol);
      }

      continue;
    }

    const full = shipStatus.cargo.capacity === shipStatus.cargo.units;

    if (shipStatus.nav.waypointSymbol === asteroidFieldLocationSymbol) {
      if (!full) {
        await extractTillFullProcedure(ship.symbol);
      }

      if (full) {
        await dock(shipStatus);
        await refuel(ship.symbol);

        if (contractItemQuantity > 0) {
          await navigate(ship.symbol, contractLocationSymbol);
        }

        if (contractItemQuantity === 0) {
          await sellAll(ship);
        }
      }
      continue;
    }
  }
});
