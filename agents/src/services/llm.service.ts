import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

export class LLMService {
    private client: BedrockRuntimeClient;
    // Using Claude 3.5 Sonnet
    private modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";

    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: fromNodeProviderChain(),
        });
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            const payload = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4096,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                system: systemPrompt,
            };

            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: "application/json",
                body: JSON.stringify(payload),
            });

            const response = await this.client.send(command);
            const decodedBody = new TextDecoder().decode(response.body);
            const responseBody = JSON.parse(decodedBody);

            if (responseBody.content && responseBody.content.length > 0) {
                return responseBody.content[0].text;
            }

            return "";
        } catch (error) {
            console.error("Error invoking Bedrock:", error);
            throw error;
        }
    }
}
