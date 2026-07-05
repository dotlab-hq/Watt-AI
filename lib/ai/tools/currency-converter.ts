import { tool } from "ai";
import { z } from "zod";

export const currencyConverter = tool({
  description:
    "Convert an amount from one currency to another using live exchange rates.",
  inputSchema: z.object({
    amount: z.number().positive().describe("Amount to convert"),
    from: z
      .string()
      .length(3)
      .describe("Source currency code (e.g., 'USD', 'EUR', 'GBP')"),
    to: z
      .string()
      .length(3)
      .describe("Target currency code (e.g., 'USD', 'EUR', 'GBP')"),
  }),
  execute: async (input) => {
    const from = input.from.toUpperCase();
    const to = input.to.toUpperCase();

    if (from === to) {
      return { amount: input.amount, from, to, rate: 1, result: input.amount };
    }

    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?amount=${input.amount}&from=${from}&to=${to}`
      );

      if (!res.ok) {
        return { error: `Could not fetch exchange rates (HTTP ${res.status}).` };
      }

      const data = await res.json();
      const result = data.rates?.[to];

      if (result === undefined) {
        return { error: `Unknown currency code: "${to}".` };
      }

      return {
        amount: input.amount,
        from,
        to,
        rate: result / input.amount,
        result,
        date: data.date,
      };
    } catch {
      return { error: "Failed to fetch exchange rates. Check your connection." };
    }
  },
});
