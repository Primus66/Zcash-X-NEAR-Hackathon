import type { Plugin } from "@elizaos/core";
import { continueAction } from "./actions/continue.ts";
import { sendZecAction } from "./actions/sendZcash.ts";
import { getBalanceAction } from "./actions/getBalance.ts";
import { getAddressesAction } from "./actions/getAddresses.ts";
import { getTransactionAction } from "./actions/getTransactions.ts";
import { factEvaluator } from "./evaluators/fact.ts";
import { goalEvaluator } from "./evaluators/goal.ts";
import { boredomProvider } from "./providers/boredom.ts";
import { factsProvider } from "./providers/facts.ts";
import { timeProvider } from "./providers/time.ts";

export * as actions from "./actions/index.ts";
export * as evaluators from "./evaluators/index.ts";
export * as providers from "./providers/index.ts";

export const zcashPlugin: Plugin = {
    name: "zcash",
    description: "Agent zcash with basic actions and evaluators",
    actions: [
        sendZecAction,
        getBalanceAction,
        getAddressesAction,
        continueAction,
        getTransactionAction,
    ],
    evaluators: [factEvaluator, goalEvaluator],
    providers: [boredomProvider, timeProvider, factsProvider],
};
export default zcashPlugin;
