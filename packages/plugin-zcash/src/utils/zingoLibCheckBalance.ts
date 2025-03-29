import { execSync } from "child_process";
import { existsSync } from "fs";

export default function executeZingoCheckBalance(
    command: string,
    params: Record<string, string>
): string {
    const zingoPath = "~/zingolib/target/release/zingo-cli";
    const resolvedPath = zingoPath.replace(
        "~",
        process.env.HOME || "/home/" + process.env.USER
    );

    if (!existsSync(resolvedPath)) {
        throw new Error(`zingo-cli not found at ${resolvedPath}`);
    }

    const args = [
        `--server ${params.server || "http://127.0.0.1:8137"}`,
        `--data-dir ${params.dataDir || "/mnt/d/zaino/zebra/.cache/zaino"}`,
        command,
    ].join(" ");

    console.log("This", params);

    console.log(args);

    try {
        return execSync(`${resolvedPath} ${args}`).toString();
    } catch (error) {
        throw new Error(
            `Zingo CLI error: ${error.stderr?.toString() || error.message}`
        );
    }
}
