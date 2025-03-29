import { defaultCharacter } from "./defaultCharacter";
import { type Character, ModelProviderName } from "@elizaos/core";

export const mainCharacter: Character = {
    ...defaultCharacter,
    modelProvider: ModelProviderName.GROQ,
};
