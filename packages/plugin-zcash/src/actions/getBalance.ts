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
- Check wallet balances
- Verify transaction status

Recent transaction history:
{{attachments}}

{{messageDirections}}

{{recentMessages}}

{{actions}}

{{checkBalance}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export const getBalanceAction: Action = {
    name: "CHECK_ZEC_BALANCE",
    similes: [
        "CHECK_ADDRESS_BALANCE",
        "CHECK_BALANCE",
        "CHECK_WALLET_BALANCE",
        "BALANCE",
    ],
    description:
        "ONLY use this action when the message requests to check ZEC balance",
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
        const result = executeZingoCheckBalance("balance", {});
        // const jsonResult = JSON.parse(result);
        const jsonPart = result.match(/{[\s\S]*$/);
        const newResult = jsonPart[0];
        const resultMatch = newResult.match(/{[\s\S]*}$/);

        console.log("Transaction result:", resultMatch);

        // } catch (err) {
        //     console.log("This Error", err);
        // }

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
            text: `${response.text}\nAnyways, these are all the balances of all your addresses: ${newResult}`,
            actions: ["CHECK_ZEC_BALANCE"],
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
                    text: "Can you help check my balance?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "yeah yeah for sure, checking ZCASH balance is pretty straightforward, trust me.",
                    actions: ["CHECK_ZEC_BALANCE"],
                },
            },
            {
                user: "{{user1}}",
                content: { text: "Check balance" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Checking ZEC Balance",
                    thought: "Internal reasoning",
                    actions: ["CHECK_ZEC_BALANCE"],
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
                    actions: ["CHECK_ZEC_BALANCE"],
                },
            },
        ],
    ],
};
