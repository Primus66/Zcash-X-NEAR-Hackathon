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
import executeZingoCli from "../utils/zingoLib";
import executeZingoSend from "../utils/zingoLibSend";

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
Note that {{agentName}} can send and receive Zcash (ZEC) transactions. Recent transaction history has been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

{{actions}}

# Instructions: Write the next message for {{agentName}}.
` + messageCompletionFooter;

export const shouldSendZecTemplate =
    `# Task: Decide if {{agentName}} should send ZEC in this context.

{{agentName}} is careful with transactions. 
If ANY of these are true, answer YES:
1. The user explicitly requested it
2. It's part of an agreed-upon payment
3. It's clearly appropriate for the context
4. The message contains a ZEC amount and recipient
5. The user directly asked to send ZEC
5. This continues a previous transaction discussion
6. The amount is reasonable (<100 ZEC)

Otherwise answer NO.

Recent conversation:
{{recentMessages}}

Final Answer (YES/NO): ` + booleanFooter;

export const sendZecTemplate =
    `# Action: Send Zcash (ZEC)
Safely send Zcash to a specified recipient.

# Transaction Details
- Recipient Address: {{recipientAddress}}
- Amount: {{amount}} ZEC
- Current ZEC Balance: {{balance}}

# Instructions
1. Verify the recipient address is valid
2. Check sufficient balance
3. Prepare transaction

Additional Context:
{{transactionContext}}

Proceed with transaction?` + messageCompletionFooter;

export const sendZecResultTemplate =
    `# Transaction Result
{{#if error}}
Failed to send ZEC: {{error}}
{{else}}
Successfully sent {{amount}} ZEC to {{recipientAddress}}
Transaction ID: {{transactionResult.txid}}
New Balance: {{transactionResult.balance}} ZEC
{{/if}}

Additional Context:
{{transactionContext}}` + messageCompletionFooter;

export const sendZecAction: Action = {
    name: "SEND_ZCASH",
    similes: ["SEND_CRYPTO", "SEND_FUNDS", "SEND_ZEC"],
    description:
        "ONLY use this action when the message requests to make a ZEC payment",
    suppressInitialMessage: true,

    validate: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => {
        if (!message?.content?.text) return false;

        const text = message.content.text.toLowerCase();

        // 1. Check for transaction verbs
        const transactionVerbs = [
            "send",
            "transact",
            "transfer",
            "pay",
            "forward",
            "dispatch",
            "transmit",
            "remit",
            "issue",
            "give",
            "donate",
        ];

        const hasTransactionVerb = transactionVerbs.some((verb) =>
            text.includes(verb)
        );
        if (!hasTransactionVerb) return false;

        // 2. Check for ZEC currency mentions
        const currencyKeywords = [
            "zec",
            "zcash",
            "z cash",
            "zecash",
            "z coins",
        ];

        const hasCurrency = currencyKeywords.some((keyword) =>
            text.includes(keyword)
        );
        if (!hasCurrency) return false;

        // 3. Check for amount
        const amountMatch = text.match(/\d+\.?\d*/);
        const amount = amountMatch ? parseFloat(amountMatch[0]) : null;
        if (!amount || amount <= 0) return false;

        // 4. Check for destination indicator ("to")
        const destinationIndicators = [
            "to",
            "address",
            "recipient",
            "wallet",
            "destination",
            "for",
            "=>",
            "→", // including symbol variations
        ];

        const hasDestination = destinationIndicators.some((indicator) =>
            text.includes(indicator)
        );

        // 5. Optional: Verify there's text that looks like an address after "to"
        const potentialAddress = hasDestination
            ? text
                  .split(/(to|address|recipient)/i)[2]
                  ?.trim()
                  .split(/\s+/)[0]
            : null;

        const hasAddressLikeText = potentialAddress
            ? /^[tz][a-km-zA-HJ-NP-Z1-9]{34}$/.test(potentialAddress) // Basic Zcash address regex
            : false;

        // Debugging logs
        console.log("Enhanced transaction validation:", {
            hasTransactionVerb,
            hasCurrency,
            amount,
            hasDestination,
            potentialAddress,
            hasAddressLikeText,
        });

        return (
            hasTransactionVerb && hasCurrency && amount > 0 && hasDestination
        );
        // Note: hasAddressLikeText is optional depending on strictness needed
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        console.log(message.content.text);

        // try {
        // Extract transaction details from message
        const amountMatch = message.content.text.match(/(\d+\.?\d*)\s+zec/i);
        const addressMatch = message.content.text.match(
            /(t|z)[a-km-zA-HJ-NP-Z1-9](10,)/
        );

        const text = message.content.text;
        const destinationIndicators = [
            "to",
            "address",
            "recipient",
            "wallet",
            "destination",
            "for",
            "=>",
            "→", // including symbol variations
        ];

        const hasDestination = destinationIndicators.some((indicator) =>
            text.includes(indicator)
        );

        const potentialAddress = hasDestination
            ? text
                  .split(/(to|address|recipient)/i)[2]
                  ?.trim()
                  .split(/\s+/)[0]
            : null;

        console.log(amountMatch, potentialAddress);

        if (!amountMatch || !potentialAddress) {
            throw new Error("Could not extract amount or address");
        }

        console.log(potentialAddress, text);

        const [_, amount] = amountMatch;
        const address = potentialAddress;

        // Execute Zingo CLI
        const result = executeZingoSend("quicksend", {
            address,
            amount,
            // Add other required parameters like memo if needed
        });
        // const jsonResult = JSON.parse(result);
        const jsonPart = result.match(/{[\s\S]*$/);
        const newResult = jsonPart[0];

        console.log("Transaction result:", newResult);
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
            text: `${response.text}\nAnyways, these are all the info from your just concluded transaction: ${newResult}`,
            actions: ["SEND_ZCASH"],
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
                    text: "Can you help transfer some ZCASH?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "yeah yeah for sure, sending ZCASH is pretty straightforward. just need the recipient and amount. everything else is basically fine, trust me.",
                    actions: ["SEND_ZCASH"],
                },
            },
            {
                user: "{{user1}}",
                content: { text: "Send 4 zec" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Can't send zec without an address",
                    thought: "Internal reasoning",
                    actions: ["SEND_ZCASH"],
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
                    actions: ["SEND_ZCASH"],
                },
            },
        ],
    ],
};
