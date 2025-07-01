
import { z } from "zod";

export const TradeSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.coerce.date(),
  asset: z.string().nonempty({ message: "Asset is required." }),
  strategy: z.string().nonempty({ message: "Strategy is required." }),
  direction: z.enum(["Buy", "Sell"]),
  entryTime: z.string().nonempty({ message: "Entry time is required." }),
  entryPrice: z.coerce.number({ required_error: "Entry price is required." }).default(0),
  sl: z.coerce.number({ required_error: "Stop loss is required." }).default(0),
  tp: z.coerce.number({ required_error: "Take profit is required." }).default(0),
  rr: z.coerce.number().optional().default(0),
  exitPrice: z.coerce.number({ required_error: "Exit price is required." }).default(0),
  result: z.enum(["Win", "Loss", "BE", "Missed"]),
  mistakes: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export type Trade = z.infer<typeof TradeSchema>;
export type MistakeTag = string;
