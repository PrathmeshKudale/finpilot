import { Tx, Budget } from "./types";
import { buildAlerts, budgetStatus, LATEST_MONTH } from "./engine";

export function alertsFor(txs: Tx[], budgets: Budget[]) {
  return buildAlerts(budgetStatus(txs, budgets, LATEST_MONTH), LATEST_MONTH);
}
