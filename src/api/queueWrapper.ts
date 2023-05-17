import axios, { AxiosResponse } from "axios";
import PQueue from "p-queue";
import { sleep } from "../util.js";
import { api } from "./api.js";

const QUEUE_VERBOSE = false;

const queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 2000 });

if (QUEUE_VERBOSE) {
  queue.on("add", (item) => {
    console.log(
      `Task is added.  Size: ${queue.size}  Pending: ${queue.pending} - ${item}`
    );
  });

  queue.on("next", () => {
    console.log(
      `Task is completed.  Size: ${queue.size}  Pending: ${queue.pending}`
    );
  });
}

export async function apiQueueWrapper(
  method: "GET" | "POST",
  url: string,
  data: object | null = null,
  params: object | null = null
): Promise<AxiosResponse<any, any>> {
  try {
    const response = await queue.add(async () => {
      return await api.request({
        url,
        method,
        ...(data && { data }),
        ...(params && { params }),
      });
    });

    if (!response) {
      throw new Error("No response returned.");
    }
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (
        error.response.status === 400 &&
        error.response.data.error?.code === 4214
      ) {
        // Ship in transit
        const deltaEta = error.response.data.error.data.secondsToArrival * 1000;

        console.log(`[IT] Waiting ${deltaEta} seconds...`);
        sleep(deltaEta);
        return apiQueueWrapper(method, url, data);
      }

      if (
        error.response.status === 409 &&
        error.response.data.error?.code === 4000
      ) {
        // Ship action is still on cooldown
        const cooldown =
          error.response.data.error.data.cooldown.remainingSeconds * 1000;

        console.log(`[CD] Waiting ${cooldown} seconds...`);
        await sleep(cooldown);
        return apiQueueWrapper(method, url, data);
      }
    }
    throw error;
  }
}
