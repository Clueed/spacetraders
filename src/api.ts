import axios from "axios";
import * as dotenv from "dotenv";
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
        const cooldown = parseFloat(error.response.data.error.data.retryAfter);

        await new Promise((resolve) => {
          console.log(`[RL] Waiting ${cooldown} seconds...`);
          setTimeout(resolve, cooldown);
        });

        //return api.request(error.config);
      }

      // wait till arrival if ship in transit
      if (error.response?.status === 400) {
        await new Promise((resolve) => {
          setTimeout(
            resolve,
            error.response.data.error.data.secondsToArrival * 1000
          );
        });
      }

      return Promise.reject(error);
    }
  );
}
