import axios, { AxiosError } from 'axios'
import * as dotenv from 'dotenv'
import { sleep } from '../util.js'
dotenv.config()

// In seconds
const MAX_RETRY = 600
const MIN_RETRY = 2
let retry = MIN_RETRY

export const api = axios.create({
  baseURL: 'https://api.spacetraders.io/v2/',
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SPACETRADERS_API_KEY}`
  }
})

api.interceptors.response.use(
  function (response) {
    if (retry !== MIN_RETRY) {
      retry = MIN_RETRY
    }
    return response
  },
  async function (error) {
    if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
      console.log(`[TO] Waiting ${retry} seconds...`)
      await sleep(retry * 1000)
      if (retry < MAX_RETRY) {
        retry = retry ^ 2
      }
      return await api.request(error.config)
    }

    // api rate limit
    if (error.response?.status === 429) {
      const cooldownFloat =
        parseFloat(error.response.data.error.data.retryAfter) + 1
      const cooldown = Math.floor(cooldownFloat * 1100)

      console.log(`[RL] Waiting ${cooldownFloat} seconds...`)
      await sleep(cooldown)

      return await api.request(error.config)
    }

    return await Promise.reject(error)
  }
)
