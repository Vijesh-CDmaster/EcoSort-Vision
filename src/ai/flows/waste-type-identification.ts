'use server';

/**
 * @fileOverview A waste type identification AI agent.
 *
 * - identifyWasteType - A function that handles the waste identification process.
 * - IdentifyWasteTypeInput - The input type for the identifyWasteType function.
 * - IdentifyWasteTypeOutput - The return type for the identifyWasteType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyWasteTypeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the waste, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyWasteTypeInput = z.infer<typeof IdentifyWasteTypeInputSchema>;

const IdentifyWasteTypeOutputSchema = z.object({
  wasteType: z.string().describe('The identified type of waste.'),
  confidence: z.number().describe('The confidence level of the identification (0-1).'),
});
export type IdentifyWasteTypeOutput = z.infer<typeof IdentifyWasteTypeOutputSchema>;

export async function identifyWasteType(input: IdentifyWasteTypeInput): Promise<IdentifyWasteTypeOutput> {
  return identifyWasteTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyWasteTypePrompt',
  input: {schema: IdentifyWasteTypeInputSchema},
  output: {schema: IdentifyWasteTypeOutputSchema},
  prompt: `You are an expert in waste management and recycling.

You will identify the type of waste in the image provided.

Analyze the following image and determine the waste type. Return the waste type and a confidence level (0-1).

Image: {{media url=photoDataUri}}
`,
});

const identifyWasteTypeFlow = ai.defineFlow(
  {
    name: 'identifyWasteTypeFlow',
    inputSchema: IdentifyWasteTypeInputSchema,
    outputSchema: IdentifyWasteTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
