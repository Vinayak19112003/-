
'use server';
/**
 * @fileOverview An AI agent for parsing trade data from various file types (CSV, PDF, Image).
 *
 * This file defines a Genkit flow that uses an AI model to analyze a file
 * (provided as a data URI) and extract structured trade data from it. It's
 * designed to be robust and handle various formats intelligently.
 *
 * @exports importTrades - The primary function to invoke the AI trade parsing flow.
 * @exports ImportTradesInput - The Zod schema for the input to the flow.
 * @exports ImportTradesOutput - The Zod schema for the output of the flow.
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

export const ImportTradesInputSchema = z.object({
  fileDataUri: z.string().describe("A file containing trade data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The file can be a CSV, PDF, or an image of trades."),
});
export type ImportTradesInput = z.infer<typeof ImportTradesInputSchema>;

export const ImportTradesOutputSchema = z.object({
  trades: z.array(AITradeSchema).describe('An array of parsed trade objects.'),
});
export type ImportTradesOutput = z.infer<typeof ImportTradesOutputSchema>;


/**
 * A wrapper function that executes the Genkit flow for importing trades.
 * This is the main entry point for using this AI capability from the frontend.
 * @param input - The input data containing the file data URI.
 * @returns A promise that resolves to the parsed trade data.
 */
export async function importTrades(input: ImportTradesInput): Promise<ImportTradesOutput> {
  return importTradesFlow(input);
}

/**
 * @name importTradesPrompt
 * @description A Genkit prompt that instructs the AI on how to parse trade data from a file.
 * It's a detailed prompt that tells the AI how to handle various data formats,
 * missing fields, and specific calculations (like Risk/Reward).
 */
const prompt = ai.definePrompt({
  name: 'importTradesPrompt',
  input: {schema: ImportTradesInputSchema},
  output: {schema: ImportTradesOutputSchema},
  prompt: `You are an expert data parsing agent specializing in trading journals.
Your task is to analyze the provided file content (which could be CSV, a broker statement in PDF, or a screenshot of trades) and convert it into a structured JSON array of trade objects.

You must intelligently map the columns or text to the required trade fields. The column names or labels might not be exact matches. Use your understanding of trading terminology to make logical mappings. For example, 'symbol' or 'instrument' should map to 'asset', 'p/l' or 'profit' should map to 'pnl'.

For each trade, you must provide values for all the fields in the output schema.

**Handling Missing Data:**
- **strategy**: If a strategy is not specified, you MUST default to the string 'Imported'.
- **confidence**: If confidence is not specified, you MUST default to the number 5.
- **rr (Risk/Reward)**: If the risk-to-reward ratio is not provided, you MUST calculate it. For a 'Buy' trade, the formula is \`abs(exitPrice - entryPrice) / abs(entryPrice - sl)\`. For a 'Sell' trade, the formula is also \`abs(exitPrice - entryPrice) / abs(entryPrice - sl)\`. It must always be a positive number. If \`entryPrice\` is equal to \`sl\`, the denominator will be zero; in this case, you MUST set \`rr\` to 0.
- **pnl**: The profit or loss in currency amount. **Pay close attention to the units.** If a value is in cents (e.g., '100 USC' or a column header indicates cents), you MUST convert it to dollars by dividing by 100. So, a value of 100 in a 'profit_usc' column becomes a PNL of 1.
- **ticket**: If an order ID, ticket number, or execution ID is present, map it to this field. Default to an empty string \`""\` if not present.
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
- **session**: If not specified, infer from the time of day if possible (e.g., London, New York, Asian). Must be one of "London", "New York", "Asian".
- **keyLevel**: If not specified, default to an empty string "".
- **entryTimeFrame**: If not specified, default to '15m'. Must be one of "1m", "3m", "5m", "15m", "1h", "4h", "Daily".

Analyze this file and provide the output in the specified JSON format:
{{media url=fileDataUri}}
`,
});

/**
 * @name importTradesFlow
 * @description The main Genkit flow definition for importing trades.
 * It takes the file data URI, passes it to the AI prompt, and returns the structured output.
 */
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
