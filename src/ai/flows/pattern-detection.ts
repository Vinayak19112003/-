// This file uses server-side code.
'use server';

/**
 * @fileOverview AI agent for pattern detection in trade notes.
 *
 * - patternDetection - A function that analyzes trade notes for patterns.
 * - PatternDetectionInput - The input type for the patternDetection function.
 * - PatternDetectionOutput - The return type for the patternDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PatternDetectionInputSchema = z.object({
  tradeNotes: z.string().describe('A string containing all trade notes to analyze.'),
});
export type PatternDetectionInput = z.infer<typeof PatternDetectionInputSchema>;

const PatternDetectionOutputSchema = z.object({
  patterns: z
    .string()
    .describe(
      'A summary of patterns detected in the trade notes, including potentially predictive characteristics of profitability or loss for specific assets or strategies.'
    ),
});
export type PatternDetectionOutput = z.infer<typeof PatternDetectionOutputSchema>;

export async function patternDetection(input: PatternDetectionInput): Promise<PatternDetectionOutput> {
  return patternDetectionFlow(input);
}

const patternDetectionPrompt = ai.definePrompt({
  name: 'patternDetectionPrompt',
  input: {schema: PatternDetectionInputSchema},
  output: {schema: PatternDetectionOutputSchema},
  prompt: `You are an expert trading analyst. Analyze the following trade notes to identify patterns and insights that could improve trading strategy. Focus on identifying potentially predictive characteristics of profitability or loss for specific assets or strategies.

Trade Notes: {{{tradeNotes}}}`,
});

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
