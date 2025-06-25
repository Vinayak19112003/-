import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.date(),
  asset: z.enum(["NAS100", "XAUUSD"]),
  strategy: z.enum(["NQ #1", "NQ #2", "Gold"]),
  direction: z.enum(["Buy", "Sell"]),
  entryTime: z.string().nonempty({ message: "Entry time is required." }),
  entryPrice: z.number({ required_error: "Entry price is required." }),
  sl: z.number({ required_error: "Stop loss is required." }),
  tp: z.number({ required_error: "Take profit is required." }),
  rr: z.number().optional(),
  exitPrice: z.number({ required_error: "Exit price is required." }),
  result: z.enum(["Win", "Loss", "BE"]),
  mistake: z.boolean().default(false),
  notes: z.string().optional(),
  screenshot: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;
