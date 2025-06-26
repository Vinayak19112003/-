
import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.coerce.date(),
  asset: z.enum(["NQ", "XAU"]),
  strategy: z.enum(["9 AM CRT", "9.30 15M MODEL", "ASIAN MODEL"]),
  direction: z.enum(["Buy", "Sell"]),
  entryTime: z.string().nonempty({ message: "Entry time is required." }),
  entryPrice: z.coerce.number({ required_error: "Entry price is required." }).default(0),
  sl: z.coerce.number({ required_error: "Stop loss is required." }).default(0),
  tp: z.coerce.number({ required_error: "Take profit is required." }).default(0),
  rr: z.coerce.number().optional().default(0),
  exitPrice: z.coerce.number({ required_error: "Exit price is required." }).default(0),
  result: z.enum(["Win", "Loss", "BE"]),
  mistakes: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  screenshot: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;
export type MistakeTag = string;
