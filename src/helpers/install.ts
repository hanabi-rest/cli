import type { PackageManager } from "@/src/helpers/get-pkg-manager";
import chalk from "chalk";
import spawn from "cross-spawn";
import packageJson from "package-json";

export async function install(packageManager: PackageManager, dependencies: string[]): Promise<void> {
  
  const validDependencies: string[] = []

  // Check if dependencies exist in the npm registry
  for (const dep of dependencies) {
    try {
      await packageJson(dep);
      validDependencies.push(dep)
    } catch (error) {
      console.info(`Dependency ${chalk.red(dep)} does not exist in the npm registry. Skip...`);
    }
  }

  const args: string[] = [];

  if (packageManager === "yarn") {
    if (validDependencies.length > 0) {
      // Use 'add' command if there are valid dependencies
      args.push("add", ...validDependencies);
    } else {
      args.push("install");
    }
  } else {
    // npm or pnpm or bun
    args.push("install", ...validDependencies);
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
