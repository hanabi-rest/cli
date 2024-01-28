import path from "path";
import { installTemplate } from "@/templates";
import chalk from "chalk";
import type { PackageManager } from "./helpers/get-pkg-manager";
import { tryGitInit } from "./helpers/git";

export async function createApp({
  appPath,
  packageManager,
  skipCodePackage,
  appId,
}: { appPath: string; packageManager: PackageManager; skipCodePackage: boolean; appId: string }): Promise<void> {
  const root = path.resolve(appPath);

  const appName = path.basename(root);

  console.info(`Creating a new Hono.js app in ${chalk.green(root)}.`);
  console.info();

  await installTemplate({ root, appName, packageManager, skipCodePackage, appId });

  if (tryGitInit(root)) {
    console.info("Initialized a git repository.");
    console.info();
  }

  console.info();
  console.info(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.info();
  console.info(`Edit ${chalk.red("wrangler.toml")} to connect with D1.`);
  console.info();
}
