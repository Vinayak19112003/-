// This file uses server-side code.
'use server';

/**
 * @fileOverview AI agent for pattern detection in trade notes.
 *
 * This file defines a Genkit flow that uses an AI model to analyze a collection
 * of a trader's journal entries, notes, and psychological data. It identifies
 * behavioral patterns, emotional correlations, and provides actionable insights
 * to help improve trading performance.
 *
 * @exports patternDetection - The primary function to invoke the AI analysis flow.
 * @exports PatternDetectionInput - The Zod schema for the input to the flow.
 * @exports PatternDetectionOutput - The Zod schema for the output of the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const PatternDetectionInputSchema = z.object({
  tradeNotes: z.string().describe('A string containing all trade notes, emotional states, and psychological reflections to analyze.'),
});
export type PatternDetectionInput = z.infer<typeof PatternDetectionInputSchema>;

export const PatternDetectionOutputSchema = z.object({
  patterns: z
    .string()
    .describe(
      'A summary of patterns detected in the trade notes, including potentially predictive characteristics of profitability or loss for specific assets or strategies.'
    ),
});
export type PatternDetectionOutput = z.infer<typeof PatternDetectionOutputSchema>;

/**
 * A wrapper function that executes the Genkit flow for pattern detection.
 * This is the main entry point for using this AI capability from the frontend.
 * @param input - The input data containing the compiled trade notes.
 * @returns A promise that resolves to the AI-generated analysis.
 */
export async function patternDetection(input: PatternDetectionInput): Promise<PatternDetectionOutput> {
  return patternDetectionFlow(input);
}

/**
 * @name patternDetectionPrompt
 * @description A Genkit prompt that instructs the AI to act as a trading psychologist.
 * It provides a structured set of tasks for the AI to perform, such as identifying
 * emotional correlations and analyzing behavioral loops, based on the provided journal entries.
 */
const patternDetectionPrompt = ai.definePrompt({
  name: 'patternDetectionPrompt',
  input: {schema: PatternDetectionInputSchema},
  output: {schema: PatternDetectionOutputSchema},
  prompt: `You are an expert trading psychologist and performance coach. Your goal is to analyze a trader's journal entries to uncover deep-seated behavioral and psychological patterns that affect their profitability.

You will be provided with a compilation of a trader's journal entries. Each entry may contain:
- General notes
- The trader's emotional state before and after the trade (e.g., Focused, Anxious, FOMO)
- Structured reflections on market context, entry reasons, feelings during the trade, and analysis of losses.

Your analysis MUST go beyond surface-level observations. Connect the dots between their emotional states, their thought processes (from the structured prompts), and their trading outcomes.

**Your Task:**
1.  **Identify Emotional Correlations:** What is the relationship between pre-trade emotions (like FOMO, Anxiety, Confidence) and the trade results? For example: "I see a strong pattern where trades entered with a 'FOMO' emotion have a significantly lower win rate and often correlate with ignoring your defined trading rules."
2.  **Analyze Behavioral Loops:** Are there recurring behaviors described in the notes? For example, "You frequently note feeling anxious when a trade moves against you, and in 70% of those cases, you exit the trade early, even when it would have eventually hit your profit target. This suggests a lack of trust in your stop-loss placement."
3.  **Connect Process to Outcome:** Based on the 'Loss Analysis' prompt, distinguish between bad luck and bad process. Highlight when losses are due to rule-breaking. For instance: "You've identified several losses as 'bad process' and they often coincide with not waiting for a confirmed liquidity sweep, a rule you have defined."
4.  **Provide Actionable Insights:** Give concrete, actionable advice. Instead of saying "Be less anxious," say "To combat the anxiety you feel during drawdown, consider reducing your position size by 25% on your A+ setups for the next week. This will help you trust your analysis and hold the trade to your target."
5.  **Structure your output** as a concise, easy-to-read summary. Use headings or bullet points to organize your findings.

**Trader's Journal Entries:**
{{{tradeNotes}}}`,
});

/**
 * @name patternDetectionFlow
 * @description The main Genkit flow definition for trade pattern analysis.
 * It takes the compiled notes, passes them to the AI prompt, and returns the analysis.
 */
const patternDetectionFlow = ai.defineFlow(
  {
    name: 'patternDetectionFlow',
    inputSchema: PatternDetectionInputSchema,
    outputSchema: PatternDetectionOutputSchema,
  },
  async input => {
    const {output} = await patternDetectionPrompt(input);
    return output!;
  }
);
