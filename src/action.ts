import { inspect } from "util";
import * as core from "@actions/core";
import { Options } from "./types";
import { generate } from "./generator";

async function run() {
    try {
        const options: Options = {
            template: core.getInput("template") || "github",
            ascending: core.getBooleanInput("ascending"),
            releaseDate: core.getInput("release-date") || new Date().toISOString().substr(0, 10),
            releaseVersion: core.getInput("release-version", { required: true }),
            file: core.getInput("file") || "CHANGELOG.md",
            commitOutput: core.getInput("commit-output"),
            repository: core.getInput("repository") || process.cwd(),
            notableChanges: core.getBooleanInput("notable-changes"),
            githubHandle: core.getInput("github-handle")
        };

        await generate(options);
    } catch (error) {
        core.info(inspect(error));
        const e: Error = error as Error;
        core.setFailed(e.message);
    }
}

run();
