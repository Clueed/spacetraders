import { Ship, NavWaypoint } from "./types/Ship.js";
import { TradeSymbol } from "./types/TradeSymbols.js";
import { apiWrapper } from "./api.js";
import axios from "axios";
import { sleep } from "./util.js";
import { Waypoint } from "./types/Waypoint.js";
import { Marketplace } from "./types/Marketplace.js";

export async function getShips(): Promise<Ship[]> {
  try {
    const response = await apiWrapper("GET", "my/ships");
    if (response.status === 200) {
      return response.data.data;
    } else {
      console.error(response);
      return response.data.data;
    }
  } catch (error) {
    throw error;
  }
}

export async function dock(ship: Ship): Promise<void> {
  const shipSymbol = ship.symbol;

  if (ship.nav.status === "DOCKED") {
    return;
  }

  console.log(`${shipSymbol}: Docking...`);
  try {
    const response = await apiWrapper("POST", `my/ships/${shipSymbol}/dock`);
    if (response.status === 200) {
      console.log(`${shipSymbol}: Docked`);
    }
  } catch (error) {
    console.error(`${shipSymbol}: DOCKING FAILED`);
    console.error(error);
  }
}

export async function navigate(
  shipSymbol: string,
  waypointSymbol: string
): Promise<void> {
  let deltaEta = 0;

  console.log(`${shipSymbol}: Initialized navigation to ${waypointSymbol}`);
  try {
    const response = await apiWrapper(
      "POST",
      `my/ships/${shipSymbol}/navigate`,
      {
        waypointSymbol: waypointSymbol,
      }
    );
    if (response.status === 200) {
      const arrivalDate = new Date(response.data.data.nav.route.arrival);

      deltaEta = arrivalDate.getTime() - new Date().getTime();

      const deltaEtaDate = new Date(deltaEta);
      const [etaMinunte, etaSeconds] = [
        deltaEtaDate.getMinutes(),
        deltaEtaDate.getSeconds(),
      ];

      const destination = response.data.data.nav.route.destination;
      const departure = response.data.data.nav.route.departure;

      console.log(
        `${shipSymbol} @ ${departure.type} ${destination.symbol}: Departing for ${destination.type} ${departure.symbol}. EAT: T-${etaMinunte}:${etaSeconds}`
      );
    }
  } catch (error) {
    console.error(
      `${shipSymbol}: FAILED TO INITIALIZE NAVIGATION TO ${waypointSymbol}`
    );
    console.error(error);
  }

  if (deltaEta > 0) {
    await sleep(deltaEta);
    console.log(`${shipSymbol}: Arrived at ${waypointSymbol}`);
  }
}

export async function extract(
  shipSymbol: string
): Promise<{ cooldown: number; full: boolean }> {
  console.log(`${shipSymbol}: Initializing extraction...`);

  let cooldown: number = 0;
  let full: boolean = false;

  try {
    const response = await apiWrapper("POST", `my/ships/${shipSymbol}/extract`);

    if (response.status === 201) {
      const data = response.data.data;
      console.log(
        `${data.extraction.shipSymbol} extracted ${data.extraction.yield.units}x ${data.extraction.yield.symbol}`
      );
      cooldown = parseInt(data.cooldown.remainingSeconds) * 1000;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response?.status === 400) {
      console.log(`${shipSymbol}: At max capacity.`);
      full = true;
    } else {
      console.error(`${shipSymbol}: EXTRACTION FAILED`);
      throw error;
    }
  }

  return { cooldown, full };
}

export async function refuel(shipSymbol: string) {
  console.log(`${shipSymbol}: Initializing refueling...`);
  try {
    const response = await apiWrapper("POST", `my/ships/${shipSymbol}/refuel`);
    if (response.status === 200) {
      console.log(`${shipSymbol}: Refueling complete.`);
    } else {
      console.error(response);
    }
  } catch (error) {
    console.error(`${shipSymbol}: REFUELING FAILED`);
    console.error(error);
  }
}

export async function deliverContract(
  contractId: string,
  shipSymbol: string,
  tradeSymbol: TradeSymbol,
  units: number
): Promise<void> {
  console.log(`${shipSymbol}: Initializing contract delivery...`);
  try {
    const response = await apiWrapper(
      "POST",
      `my/contracts/${contractId}/deliver`,
      {
        shipSymbol: shipSymbol,
        tradeSymbol: tradeSymbol,
        units: units,
      }
    );
    if (response.status === 200) {
      console.log(
        `${shipSymbol} @ ${tradeSymbol}: delivered ${units}x to contract ${contractId}`
      );
    } else {
      console.error(response);
    }
  } catch (error) {
    console.error(`${shipSymbol}: DELIVERY FAILED`);
    console.error(error);
  }
}

export async function _sell(
  shipSymbol: string,
  units: number,
  tradeSymbol: TradeSymbol
): Promise<void> {
  console.log(`${shipSymbol}: Initializing sale`);
  try {
    const response = await apiWrapper("POST", `my/ships/${shipSymbol}/sell`, {
      symbol: tradeSymbol,
      units,
    });
    if (response.status === 201) {
      const { pricePerUnit, totalPrice, waypointSymbol } =
        response.data?.data?.transaction;
      console.log(
        `${shipSymbol} @ ${waypointSymbol}: Sold ${units}x ${tradeSymbol} for ${totalPrice} (${pricePerUnit}/u).`
      );
    } else {
      console.error(response);
    }
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error?.response?.status === 400 &&
      error?.response?.data?.error?.code === 4602
    ) {
      console.error(
        `${shipSymbol}: SALE FAILED - Item ${tradeSymbol} not available.`
      );
    } else {
      console.error(`${shipSymbol}: SALE FAILED`);
      console.error(error);
    }
  }
}

export async function getSystemWaypoits(
  systemSymbol: string
): Promise<Waypoint[]> {
  let waypoints = [];
  let page = 1;

  while (true) {
    try {
      const response = await apiWrapper(
        "GET",
        `systems/${systemSymbol}/waypoints?page=${page}&limit=20`
      );

      if (response.data.data.length === 0) {
        break;
      }

      waypoints.push(...response.data.data);
    } catch (error) {
      console.error(error);
    }

    page++;
  }

  return waypoints;
}

export async function getMarketplace(
  systemSymbol: string,
  waypointSymbol: string
): Promise<Marketplace> {
  try {
    const response = await apiWrapper(
      "GET",
      `systems/${systemSymbol}/waypoints/${waypointSymbol}/market`
    );
    if (response.status === 200) {
      return response.data.data;
    } else {
      throw response;
    }
  } catch (error) {
    throw error;
  }
}
