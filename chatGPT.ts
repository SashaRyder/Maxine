import { ChatGPTAPI } from "chatgpt";

export const chatGPT = (): ChatGPTAPI | null => {

    const authKey = process.env.CHATGPT_API_KEY;
    const instruction = process.env.CHATGPT_INSTRUCTION;

    if (!authKey) {
        return null;
    }

    return new ChatGPTAPI({
        apiKey: authKey,
        systemMessage: instruction
    })
}