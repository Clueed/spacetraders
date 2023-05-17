import { Agent } from "./Agent.js";
import { Cargo } from "./Cargo.js";
import { Transaction } from "./Transaction.js";

export interface BuySellResponse {
  agent: Agent;
  cargo: Cargo;
  transaction: Transaction;
}
