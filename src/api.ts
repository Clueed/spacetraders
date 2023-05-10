import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
import PQueue from "p-queue";
dotenv.config();

export const api = axios.create({
  baseURL: "https://api.spacetraders.io/v2/",
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SPACETRADERS_API_KEY}`,
  },
});

if (true) {
  api.interceptors.response.use(
    function (response) {
      return response;
    },
    async function (error) {
      // api rate limit
      if (error.response?.status === 429) {
        const cooldownFloat =
          parseFloat(error.response.data.error.data.retryAfter) + 1;
        const cooldown = Math.floor(cooldownFloat * 1100);

        await new Promise((resolve) => {
          console.log(`[RL] Waiting ${cooldownFloat} seconds...`);
          setTimeout(resolve, cooldown);
        });

        return api.request(error.config);
      }

      return Promise.reject(error);
    }
  );
}

const queue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 2000 });

export async function apiWrapper(
  method: "GET" | "POST",
  url: string,
  data: any = {}
) {
  const errorCallback = (error: any) => {
    if (error instanceof AxiosError && error?.response) {
    }
  };

  let response;

  await queue.add(() => {
    try {
      response = api.request({
        url,
        method: method,
        data: data,
      });
    } catch (error: any) {
      errorCallback(error);
    }
  });

  return response;
}
