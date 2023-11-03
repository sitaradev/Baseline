import dotenv from 'dotenv';
import { Configuration, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';

import { ConversationHistory } from './types';

dotenv.config();

if (!process.env.OPENAI_API_KEY || !process.env.START_PROMPT) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);
const conversationHistory: ConversationHistory = new Map();

async function getGPTResponse({ clientMessage, sender, trainingPrompt }: { clientMessage: string, sender: string, trainingPrompt?: string }): Promise<string> {
  try {
    const messages: ChatCompletionRequestMessage[] = conversationHistory.get(sender) || [
      { role: 'system', content: trainingPrompt || process.env.START_PROMPT },
    ];

    messages.push({ role: 'user', content: clientMessage });
    console.log('messages: ', messages);
    const requestBody: CreateChatCompletionRequest = {
      model: 'gpt-3.5-turbo',
      messages,
    };

    const completion = await openai.createChatCompletion(requestBody);
    //@ts-ignore
    const response = completion.data.choices[0].message.content;
    conversationHistory.set(sender, [...messages, { role: 'assistant', content: response }]);
    
    //@ts-ignore
    return response;
  } catch (error) {
    console.error('Error with ChatGPT: ', error);
    return 'The servers are currently experiencing high demand. Please try again in a few minutes.';
  }
}

export default {
  getGPTResponse,
  // sendGPTResponse,
  conversationHistory,
};
