'use server';

/**
 * @fileOverview This file defines a Genkit flow for classifying waste and suggesting the appropriate waste bin.
 *
 * The flow takes an image of waste as input and returns the suggested waste bin.
 * The file exports:
 *   - wasteBinClassification: The main function to classify waste and suggest a bin.
 *   - WasteBinClassificationInput: The input type for the wasteBinClassification function.
 *   - WasteBinClassificationOutput: The output type for the wasteBinClassification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WasteBinClassificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the waste, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // keep the backslashes, they are not an error
    ),
});
export type WasteBinClassificationInput = z.infer<typeof WasteBinClassificationInputSchema>;

const WasteBinClassificationOutputSchema = z.object({
  binSuggestion: z.enum(['recycling', 'compost', 'landfill']).describe('The suggested waste bin for the item.'),
  confidence: z.number().describe('The confidence level of the suggestion (0-1).'),
});
export type WasteBinClassificationOutput = z.infer<typeof WasteBinClassificationOutputSchema>;

export async function wasteBinClassification(input: WasteBinClassificationInput): Promise<WasteBinClassificationOutput> {
  return wasteBinClassificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wasteBinClassificationPrompt',
  input: {schema: WasteBinClassificationInputSchema},
  output: {schema: WasteBinClassificationOutputSchema},
  prompt: `You are an AI assistant specializing in waste classification.

  Analyze the image of the waste item and determine the most appropriate waste bin for it.

  Respond with the suggested bin (recycling, compost, or landfill) and a confidence level (0-1) for your suggestion.

  Image: {{media url=photoDataUri}}
  `,
});

const wasteBinClassificationFlow = ai.defineFlow(
  {
    name: 'wasteBinClassificationFlow',
    inputSchema: WasteBinClassificationInputSchema,
    outputSchema: WasteBinClassificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
