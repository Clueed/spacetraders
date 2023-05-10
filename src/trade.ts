import { TradeSymbol } from "./TradeSymbols.js";
import {
  deliverContract,
  dock,
  extract,
  getInventoryQuantity,
  getShips,
  navigate,
  refuel,
  sellAll,
} from "./util.js";
import PQueue from "p-queue";

const contractItem: TradeSymbol = "ALUMINUM_ORE";
const asteroidFieldLocationSymbol = "X1-DF55-17335A";
const contractId = "clheig9zm4i5ls60ddxtdkirp";
const contractLocationSymbol = "X1-DF55-20250Z";

if (true) {
  while (true) {
    const myShipsAll = await getShips();
    console.log(myShipsAll);
    const myShips = myShipsAll;

    myShips.map(async (ship) => {
      const contractItemQuantity = getInventoryQuantity(ship, contractItem);
      const cargoFull = ship.cargo.capacity == ship.cargo.units;

      if (ship.nav.waypointSymbol === asteroidFieldLocationSymbol) {
        console.log(`${ship.symbol} at asteroid field`);
        if (!cargoFull) {
          console.log(`${ship.symbol} cargo not full`);
          await extract(ship.symbol);
        } else {
          console.log(`${ship.symbol} cargo full`);
          if (contractItemQuantity > 0) {
            console.log(`${ship.symbol} has contract item`);
            await refuel(ship.symbol);
            await navigate(ship.symbol, contractLocationSymbol);
          } else {
            console.log(`${ship.symbol} does not have contract item`);
            await dock(ship.symbol);
            await sellAll(ship);
            await refuel(ship.symbol);
          }
        }
      } else if (ship.nav.waypointSymbol === contractLocationSymbol) {
        console.log(`${ship.symbol} at contract location`);
        if (contractItemQuantity > 0) {
          console.log(`${ship.symbol} has contract item`);
          await dock(ship.symbol);
          await deliverContract(
            contractId,
            ship.symbol,
            contractItem,
            contractItemQuantity
          );
        } else {
          console.log(`${ship.symbol} does not have contract item`);
          await refuel(ship.symbol);
          await navigate(ship.symbol, asteroidFieldLocationSymbol);
        }
      }
      console.log("24sec break SART", ship.symbol);
    });
  }
} else {
  const queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 1000 });

  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
  console.log(await queue.add(() => getShips()));
}
