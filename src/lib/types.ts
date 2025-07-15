import { z } from "zod";

export const EmotionalStateSchema = z.enum([
  "Focused", "Anxious", "FOMO", "Greedy", "Confident", "Tired", "Neutral", "Other"
]).optional();

export const TradeSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  date: z.coerce.date(),
  asset: z.string().nonempty({ message: "Asset is required." }),
  strategy: z.string().nonempty({ message: "Strategy is required." }),
  direction: z.enum(["Buy", "Sell"]),
  entryTime: z.string().nonempty({ message: "Entry time is required." }),
  exitTime: z.string().optional(),
  entryPrice: z.coerce.number({ required_error: "Entry price is required." }).default(0),
  sl: z.coerce.number({ required_error: "Stop loss is required." }).default(0),
  rr: z.coerce.number().optional().default(0),
  exitPrice: z.coerce.number({ required_error: "Exit price is required." }).default(0),
  result: z.enum(["Win", "Loss", "BE", "Missed"]),
  confidence: z.coerce.number().min(1).max(10).default(5),
  mistakes: z.array(z.string()).optional().default([]),
  rulesFollowed: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  screenshotURL: z.string().optional().default(""),
  accountSize: z.coerce.number().optional().default(0),
  riskPercentage: z.coerce.number().optional().default(0),
  pnl: z.coerce.number().optional().default(0),
  ticket: z.string().optional(),
  
  // New psychological/contextual fields
  preTradeEmotion: EmotionalStateSchema,
  postTradeEmotion: EmotionalStateSchema,
  marketContext: z.string().optional(),
  entryReason: z.string().optional(),
  tradeFeelings: z.string().optional(),
  lossAnalysis: z.string().optional(),
  
  // New user-requested fields
  session: z.enum(["London", "New York", "Asian", "Other"]).optional(),
  keyLevel: z.string().optional(),
  entryTimeFrame: z.enum(["1m", "3m", "5m", "15m", "1h", "4h", "Daily"]).optional(),
});

export type Trade = z.infer<typeof TradeSchema>;
