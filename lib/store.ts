"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tx, EMI, Goal, Budget, Customer, Campaign } from "./types";
import { seedTransactions, EMIS, GOALS, BUDGETS, CUSTOMERS, OPENING_BALANCE } from "./mock";

export interface FinState {
  onboarded: boolean;
  bank: string;
  syncedAt: string;
  transactions: Tx[];
  emis: EMI[];
  goals: Goal[];
  budgets: Budget[];
  customers: Customer[];
  campaigns: Campaign[];
  balance: number;
  alertsSeen: string[];
  completeOnboarding: (bank: string) => void;
  resetDemo: () => void;
  recategorize: (id: string, category: string) => void;
  setBudget: (category: string, limit: number) => void;
  addGoal: (g: Goal) => void;
  addCampaign: (c: Campaign) => void;
  markAlertsSeen: (ids: string[]) => void;
}

const initialData = {
  transactions: [] as Tx[],
  emis: EMIS,
  goals: GOALS,
  budgets: BUDGETS,
  customers: CUSTOMERS,
  campaigns: [] as Campaign[],
  balance: OPENING_BALANCE,
};

export const useFin = create<FinState>()(
  persist(
    (set) => ({
      onboarded: false,
      bank: "",
      syncedAt: "",
      ...initialData,
      alertsSeen: [],
      completeOnboarding: (bank) =>
        set({
          onboarded: true,
          bank,
          syncedAt: new Date().toISOString(),
          transactions: seedTransactions(),
          emis: EMIS.map((e) => ({ ...e })),
          goals: GOALS.map((g) => ({ ...g })),
          budgets: BUDGETS.map((b) => ({ ...b })),
          customers: CUSTOMERS.map((c) => ({ ...c })),
          balance: OPENING_BALANCE,
          alertsSeen: [],
        }),
      resetDemo: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("finpilot-store");
          window.location.href = "/";
        }
      },
      recategorize: (id, category) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, category } : t)),
        })),
      setBudget: (category, limit) =>
        set((s) => ({
          budgets: s.budgets.map((b) => (b.category === category ? { ...b, limit } : b)),
        })),
      addGoal: (g) => set((s) => ({ goals: [...s.goals, g] })),
      addCampaign: (c) => set((s) => ({ campaigns: [c, ...s.campaigns] })),
      markAlertsSeen: (ids) =>
        set((s) => ({ alertsSeen: [...new Set([...s.alertsSeen, ...ids])] })),
    }),
    { name: "finpilot-store" }
  )
);
