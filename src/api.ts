import axios, { AxiosError, AxiosResponse } from "axios";
import * as dotenv from "dotenv";
import PQueue from "p-queue";
import { sleep } from "./util.js";
dotenv.config();

const QUEUE_VERBOSE = false;

// In seconds
const MAX_RETRY = 600;
const MIN_RETRY = 2;
let retry = MIN_RETRY;

export const api = axios.create({
  baseURL: "https://api.spacetraders.io/v2/",
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SPACETRADERS_API_KEY}`,
  },
});

api.interceptors.response.use(
  function (response) {
    if (retry !== MIN_RETRY) {
      retry = MIN_RETRY;
    }
    return response;
  },
  async function (error) {
    if (error.response?.status === 408 || error.code === "ECONNABORTED") {
      console.log(`[TO] Waiting ${retry} seconds...`);
      await sleep(retry * 1000);
      if (retry < MAX_RETRY) {
        retry = retry ^ 2;
      }
      return api.request(error.config);
    }

    // api rate limit
    if (error.response?.status === 429) {
      const cooldownFloat =
        parseFloat(error.response.data.error.data.retryAfter) + 1;
      const cooldown = Math.floor(cooldownFloat * 1100);

      console.log(`[RL] Waiting ${cooldownFloat} seconds...`);
      await sleep(cooldown);

      return api.request(error.config);
    }

    return Promise.reject(error);
  }
);

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
export async function apiWrapper(
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
        return apiWrapper(method, url, data);
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
        return apiWrapper(method, url, data);
      }
    }
    throw error;
  }
}
