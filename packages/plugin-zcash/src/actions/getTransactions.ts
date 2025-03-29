import { composeContext } from "@elizaos/core";
import { generateMessageResponse, generateTrueOrFalse } from "@elizaos/core";
import { booleanFooter, messageCompletionFooter } from "@elizaos/core";
import {
    type Action,
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
} from "@elizaos/core";
import executeZingoCheckBalance from "../utils/zingoLibCheckBalance";

const maxSendsInARow = 3;

export const messageHandlerTemplate =
    `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}
{{knowledge}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} can:
- Send/receive Zcash (ZEC) transactions
- Check wallet addresses
- Verify transaction status

Recent transaction history:
{{attachments}}

{{messageDirections}}

{{recentMessages}}

{{actions}}

{{getTransactions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export const getTransactionAction: Action = {
    name: "CHECK_ZEC_TRANSACTIONS",
    similes: ["CHECK_TRANSACTION", "CHECK_WALLET_TRANSACTIONS", "TRANSACTIONS"],
    description:
        "ONLY use this action when the message requests to check ZEC adresses",
    suppressInitialMessage: true,

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        // Execute Zingo CLI
        const result = executeZingoCheckBalance("addresses", {});
        // const jsonResult = JSON.parse(result);
        const jsonPart = result.match(/{[\s\S]*$/);
        const newResult = jsonPart[0];
        const resultMatch = newResult.match(/{[\s\S]*}$/);

        console.log("Transaction result:", resultMatch);

        // Generate and send response
        const context = composeContext({
            state,
            template:
                runtime.character.templates?.continueMessageHandlerTemplate ||
                runtime.character.templates?.messageHandlerTemplate ||
                messageHandlerTemplate,
        });

        const response = await generateMessageResponse({
            runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        // Generate a response with thought and text components
        const responseContent = {
            ...response,
            text: `${
                response.text
            }\nAnyways, these are all all your transactions so far: ${
                newResult ? newResult : "No transactions"
            }`,
            actions: ["CHECK_ZEC_TRANSACTIONS"],
        };

        // Send the response using the callback
        if (callback) {
            await callback(responseContent);
        }

        return true; // Return true if action executed successfully
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you show me my transactions?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "yeah yeah for sure, checking ZCASH transactions is pretty straightforward, trust me.",
                    actions: ["CHECK_ZEC_TRANSACTIONS"],
                },
            },
            {
                user: "{{user1}}",
                content: { text: "Check transactions" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Checking ZEC transactions",
                    thought: "Internal reasoning",
                    actions: ["CHECK_ZEC_TRANSACTIONS"],
                },
            },
            {
                user: "{{user1}}",
                content: { text: "Trigger message" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Response",
                    thought: "Internal reasoning",
                    actions: ["CHECK_ZEC_TRANSACTIONS"],
                },
            },
        ],
    ],
};
