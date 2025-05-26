import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN!);

export async function aiSummarise(data: any) {
  const prompt = `
You are an institutional analyst.
Given this JSON data:
${JSON.stringify(data, null, 2)}

1) One-sentence BUY/HOLD/SELL signal with confidence.
2) Explanation of each indicator's trend.
3) Risk profile summary.
4) Entry and exit price suggestions.
5) Three tactical trade ideas.

Respond in JSON.
`.trim();

  const model = 'tiiuae/falcon-7b-instruct';
  const output = await hf.textGeneration({
    model,
    inputs: prompt,
    parameters: { max_new_tokens: 512, temperature: 0.3 }
  });

  // Extract JSON from generated text
  const text = output.generated_text;
  const start = text.indexOf('{');
  const json  = text.slice(start);
  return JSON.parse(json);
}