//const axios = require("axios");
import PQueue from "p-queue";
import { Ship } from "./Ship.js";
import { TradeSymbol } from "./TradeSymbols.js";
import { api } from "./api.js";

export async function dock(ship: string) {
  await queue.add(() =>
    api
      .post(`my/ships/${ship}/dock`)
      .then((response) => {
        if (response.status === 200) {
          console.info(`${ship} Docked!`);
        } else {
          console.error(response);
        }
      })
      .catch((error) => {
        console.error(error);
      })
  );
}

export async function navigate(ship: string, waypointSymbol: string) {
  let countdown = 0;

  await queue.add(() =>
    api
      .post(`my/ships/${ship}/navigate`, {
        waypointSymbol,
      })
      .then((response) => {
        if (response.status === 200) {
          const arrivalDate = new Date(response.data.data.nav.route.arrival);
          const eta = arrivalDate.getTime() - new Date().getTime();

          countdown = eta;

          const etaDate = new Date(eta);
          const [etaMinunte, etaSeconds] = [
            etaDate.getMinutes(),
            etaDate.getSeconds(),
          ];

          const destination = response.data.data.nav.route.destination;
          const departure = response.data.data.nav.route.departure;

          console.log(
            `${ship} @ ${departure.type} ${destination.symbol}: Departing for ${destination.type} ${departure.symbol}. EAT: T-${etaMinunte}:${etaSeconds}`
          );
        } else {
          console.error(response);
        }
      })
      .catch((error) => {
        console.error(error);
      })
  );

  if (countdown > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, countdown);
    });
  }
}

const queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 2000 });

export async function extract(ship: string) {
  let atCapcity: boolean = false;
  while (atCapcity === false) {
    let cooldown: number = 1;

    await queue.add(() =>
      api
        .post(`my/ships/${ship}/extract`)
        .then((response) => {
          const data = response.data.data;
          console.log(
            `${data.extraction.shipSymbol} extracted ${data.extraction.yield.units}x ${data.extraction.yield.symbol}`
          );
          cooldown = parseInt(data.cooldown.remainingSeconds);
        })
        .catch((error) => {
          if (error?.response?.status === 409) {
            // Ship action is still on cooldown
            cooldown = parseInt(
              error.response.data.error.data?.cooldown?.remainingSeconds
            );
            return;
          }

          if (error?.response?.status === 400) {
            // Ship full
            console.log(`${ship} at max capacity.`);
            atCapcity = true;
            return;
          }

          console.error(error);
        })
    );

    await new Promise((resolve) => {
      //console.log(`${ship}: waiting ${cooldown} seconds...`);
      setTimeout(resolve, 1000 * cooldown);
    });
  }
}

export async function refuel(ship: string) {
  await queue.add(() =>
    api
      .post(`my/ships/${ship}/refuel`)
      .then((response) => {
        if (response.status === 200) {
          console.log(`${ship}: Refuelling.`);
        } else {
          console.log("response :>> ", response);
        }
      })
      .catch((error) => {
        console.log("error :>> ", error);
      })
  );
}

export async function deliverContract(
  contractId: string,
  shipSymbol: string,
  tradeSymbol: TradeSymbol,
  units: number
): Promise<void> {
  await queue.add(() =>
    api
      .post(`my/contracts/${contractId}/deliver`, {
        shipSymbol: shipSymbol,
        tradeSymbol: tradeSymbol,
        units: units,
      })
      .then((response) => {
        if (response.status === 200) {
          console.log(`${shipSymbol} delivered ${units}x ${tradeSymbol}`);
        } else {
          console.error(response);
        }
      })
      .catch((error) => {
        console.error(error);
      })
  );
}

async function sell(ship: string, units: number, symbol: string) {
  await queue.add(() =>
    api
      .post(`my/ships/${ship}/sell`, {
        symbol,
        units,
      })

      .then((response) => {
        if (response.status === 201) {
          const { pricePerUnit, totalPrice, waypointSymbol } =
            response.data?.data?.transaction;
          console.log(
            `${ship} @ ${waypointSymbol}: sold ${units}x ${symbol} for ${totalPrice} (${pricePerUnit}/u).`
          );
        } else {
          console.error(response);
        }
      })

      .catch((error) => {
        if (
          error?.response?.status !== 400 &&
          error.response?.data?.error?.code !== 4602
        ) {
          //console.error(error);
        }
      })
  );
}

export async function sellAll(ship: Ship) {
  const inventory = ship.cargo.inventory;

  await Promise.all(
    inventory.map((item) => sell(ship.symbol, item.units, item.symbol))
  );
}

export async function getShips(): Promise<Ship[]> {
  return await queue.add(() =>
    api
      .get("my/ships")
      .then((response) => {
        if (response.status === 200) {
          return response.data.data;
        } else {
          console.error(response);
        }
      })
      .catch((error) => {
        console.error(error);
      })
  );
}

export async function getShipsLocation(queryShips: string[]) {
  // create dict from getShips with ships.symbol as key
  const ships = await getShips();

  let shipLocations: any = {};

  ships.map((ship: any) => {
    if (queryShips.includes(ship.symbol)) {
      shipLocations[ship.symbol] = ship.nav.waypointSymbol;
    }

    return shipLocations;
  });
}

export function getInventoryQuantity(ship: Ship, itemSymbol: TradeSymbol) {
  for (let { symbol, units } of ship.cargo.inventory) {
    if (symbol === itemSymbol) {
      return units;
    }
  }
  return 0;
}
