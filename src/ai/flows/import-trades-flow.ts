
'use server';
/**
 * @fileOverview An AI agent for parsing trade data from a CSV file.
 *
 * - importTrades - A function that handles the trade import process.
 * - ImportTradesInput - The input type for the importTrades function.
 * - ImportTradesOutput - The return type for the importTrades function.
 */

import {ai} from '@/ai/genkit';
import {TradeSchema} from '@/lib/types';
import {z} from 'genkit';

// Define a schema for a single trade that the AI should output.
// It's similar to TradeSchema but omits the ID, which we'll generate later,
// and expects a date string which we transform into a Date object.
const AITradeSchema = TradeSchema.omit({id: true}).extend({
    date: z.string().transform((val) => new Date(val)),
});

const ImportTradesInputSchema = z.object({
  csvData: z.string().describe('The full content of a CSV file containing trade data.'),
});
export type ImportTradesInput = z.infer<typeof ImportTradesInputSchema>;

const ImportTradesOutputSchema = z.object({
  trades: z.array(AITradeSchema).describe('An array of parsed trade objects.'),
});
export type ImportTradesOutput = z.infer<typeof ImportTradesOutputSchema>;


export async function importTrades(input: ImportTradesInput): Promise<ImportTradesOutput> {
  return importTradesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importTradesPrompt',
  input: {schema: ImportTradesInputSchema},
  output: {schema: ImportTradesOutputSchema},
  prompt: `You are an expert data parsing agent specializing in trading journals.
Your task is to analyze the provided CSV data and convert it into a structured JSON array of trade objects.

You must intelligently map the CSV columns to the required trade fields. The column names might not be exact matches. Use your understanding of trading terminology to make logical mappings. For example, 'symbol' or 'instrument' should map to 'asset', 'p/l' or 'profit' should map to 'pnl'.

For each trade, you must provide values for all the fields in the output schema.

**Handling Missing Data:**
- **strategy**: If a strategy is not specified in the CSV, you MUST default to the string 'Imported'.
- **confidence**: If confidence is not specified, you MUST default to the number 5.
- **rr (Risk/Reward)**: If the risk-to-reward ratio is not provided in the CSV, you MUST calculate it using the entry, stop loss, and exit prices. The formula is exactly: \`abs(exitPrice - entryPrice) / abs(entryPrice - sl)\`. If \`entryPrice\` is equal to \`sl\`, the denominator will be zero; in this case, you MUST set \`rr\` to 0.
- **pnl**: The profit or loss in currency amount.
- **result**: Must be 'Win', 'Loss', or 'BE'. Infer this from the profit/loss value (pnl). A positive pnl is a 'Win', a negative pnl is a 'Loss', and a zero pnl is 'BE'.
- **direction**: Must be 'Buy' or 'Sell'. Infer from columns like 'type' or 'side'.
- **date**: The date and time of the trade. Convert it to a valid ISO 8601 date string.
- **entryTime**: The time of entry, in HH:MM format.
- **asset**: The traded instrument/symbol.
- **entryPrice**: The price at which the trade was entered.
- **sl**: The stop loss price.
- **exitPrice**: The price at which the trade was exited.
- **mistakes**: Default to an empty array \`[]\` if not present.
- **rulesFollowed**: Default to an empty array \`[]\` if not present.
- **notes**: Default to 'Imported via AI' if not present.
- **screenshotURL**: Default to an empty string \`""\` if not present.
- **accountSize**: Default to 0 if not present.
- **riskPercentage**: Default to 0 if not present.

Analyze this CSV data and provide the output in the specified JSON format:
{{{csvData}}}
`,
});

const importTradesFlow = ai.defineFlow(
  {
    name: 'importTradesFlow',
    inputSchema: ImportTradesInputSchema,
    outputSchema: ImportTradesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
