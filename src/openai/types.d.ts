export type ConversationHistory = Map<string, ChatCompletionRequestMessage[]>;
export interface VariantsType {
  [key: string]: string[];
}

export interface VoicesType {
  [key: string]: string;
}
