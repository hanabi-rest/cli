#!/usr/bin/env node

import path from "node:path";
import { getFiles } from "@/src/helpers/fetch";
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";
import prompts from "prompts";
import type { InitialReturnValue } from "prompts";
import { createApp } from "./create-app";
import { getOnline } from "./helpers/get-online";
import { getPkgManager } from "./helpers/get-pkg-manager";
import { validateNpmName } from "./helpers/validate-pkg";
import packageJson from "../package.json";
import { readConfig, writeAuthConfigFile } from "./helpers/config-path";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const onPromptState = (state: {
  value: InitialReturnValue;
  aborted: boolean;
  exited: boolean;
}) => {
  if (state.aborted) {
    // If we don't re-enable the terminal cursor before exiting
    // the program, the cursor will remain hidden
    process.stdout.write("\x1B[?25h");
    process.stdout.write("\n");
    process.exit(1);
  }
};

let projectPath = "";

async function main() {
  const program = new Command()
    .name(packageJson.name)
    .version(packageJson.version, "-v, --version", "display the version number")
    .usage(`${chalk.green("create <id>")} [options]`);

  program
    .command("create <id>")
    .description("Create a new project based on the specified version id")
    .option("--dir <project-directory>", "directory name")
    .option("--skip-code-package", "Skip installation of npm packages imported in the code")
    .option("--main-only", "Dumps API code only.")
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
    .action(async (versionId, options) => {
      const online = await getOnline();

      if (!online) {
        console.error("You appear to be offline. Please check your internet connection and try again.");
        process.exit(1);
      }

      const config = readConfig();

      if (!config?.api_token) {
        console.info(
          chalk.yellow(`Warning: To access a private application, set the token with ${chalk.bold("@hanabi.rest/cli config set")}`),
        );
        console.info();
      }

      if (options.mainOnly) {
        const { source } = await getFiles(versionId);
        if (!source) {
          console.error("Failed to fetch files. Your API may be in the process of being generated or may have failed to generate.");
          process.exit(1);
        }

        const fileExists = fs.existsSync(path.join(process.cwd(), "index.ts"));

        if (fileExists) {
          console.info("The index.ts file already exists. Please retry with a different name.");
          process.exit(1);
        }

        fs.writeFileSync(path.join(process.cwd(), "index.ts"), source);
        console.info(`${chalk.green("Success!")} Created index.ts file in ${chalk.green(process.cwd())}`);

        return;
      }

      const packageManager = options.useNpm ? "npm" : options.usePnpm ? "pnpm" : options.useYarn ? "yarn" : getPkgManager();

      projectPath = options.dir;

      if (!options.dir) {
        const res = await prompts({
          onState: onPromptState,
          type: "text",
          name: "path",
          message: "What is your project named?",
          initial: "my-app",
          validate: (name) => {
            const validation = validateNpmName(path.basename(path.resolve(name)));
            if (validation.valid) {
              return true;
            }
            return `Invalid project name: ${validation.problems[0]}`;
          },
        });

        if (typeof res.path === "string") {
          projectPath = res.path.trim();
        }
      }

      const resolvedProjectPath = path.resolve(projectPath);
      const projectName = path.basename(resolvedProjectPath);
      const validation = validateNpmName(projectName);

      if (!validation.valid) {
        console.error(`Could not create a project called ${chalk.red(`"${projectName}"`)} because of npm naming restrictions:`);

        for (const p of validation.problems) {
          console.error(`${chalk.red(chalk.bold("*"))} ${p}`);
        }
        process.exit(1);
      }

      const root = path.resolve(resolvedProjectPath);
      const folderExists = fs.existsSync(root);

      if (folderExists) {
        console.info("The directory already exists. Please try again with a different name.");
        process.exit(1);
      }

      await createApp({
        appPath: resolvedProjectPath,
        skipCodePackage: options.skipCodePackage,
        appId: versionId,
        packageManager,
      });
    })
    .allowUnknownOption();

  const configCommand = program.command("config").description("Configure the CLI tool");

  configCommand
    .command("set")
    .description("Set a configuration option")
    .option("--api-key [key]", "Set the access token for authentication")
    .action(async (options) => {
      let apiKey: string = options.apiKey;

      if (!apiKey) {
        console.info(chalk.blue("To get your access token, visit: https://hanabi.rest/settings/tokens"));
        console.info();

        const response = await prompts({
          type: "password",
          name: "key",
          message: "Enter your Access token:",
        });
        apiKey = response.key;
      }

      if (apiKey) {
        writeAuthConfigFile({ api_token: apiKey });

        console.info();
        console.info(chalk.green("access token saved successfully."));
      } else {
        console.error(chalk.red("access token is required."));
      }
    });

  program.parse();
}

main();
