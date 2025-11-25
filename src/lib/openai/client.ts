import OpenAI from "openai";

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Please configure it to use nutrition features."
      );
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export default getOpenAIClient;

