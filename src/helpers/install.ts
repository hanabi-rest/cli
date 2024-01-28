import type { PackageManager } from "@/src/helpers/get-pkg-manager";
import chalk from "chalk";
import spawn from "cross-spawn";
import packageJson from "package-json";

export async function install(packageManager: PackageManager, dependencies: string[]): Promise<void> {
  const args: string[] = [packageManager === "yarn" && dependencies.length > 0 ? "add" : "install"];

  // Check if dependencies exist in the npm registry
  for (const dep of dependencies) {
    try {
      await packageJson(dep);
      args.push(dep);
    } catch (error) {
      console.info(`Dependency ${chalk.red(dep)} does not exist in the npm registry. Skip...`);
    }
  }

  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        ADBLOCK: "1",
        // we set NODE_ENV to development as pnpm skips dev
        // dependencies when production
        NODE_ENV: "development",
        DISABLE_OPENCOLLECTIVE: "1",
      },
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `${packageManager} ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });
}
