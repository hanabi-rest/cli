import os from "os";
import path from "path";
import { getFiles } from "@/src/helpers/fetch";
import { PackageManager } from "@/src/helpers/get-pkg-manager";
import { install } from "@/src/helpers/install";
import chalk from "chalk";
import fs from "fs-extra";
import { type PackageJson } from "type-fest";
import { extractImportsFromSource } from "@/src/helpers/ast";

export const installTemplate = async ({
  root,
  appName,
  packageManager,
  skipCodePackage,
  appId,
}: {
  root: string;
  appName: string;
  packageManager: PackageManager;
  skipCodePackage: boolean;
  appId: string;
}) => {
  console.info(`Using ${packageManager}`);

  const { md, sql, source } = await getFiles(appId);

  fs.mkdirSync(root, { recursive: true });

  await fs.copy(
    path.join(process.cwd(), "templates", "workers"),
    root,
    (err) => {
      if (err) {
        console.error("Failed to copy files. Please check permissions.", err);
        process.exit(1);
      }
    }
  );

  process.chdir(root);

  fs.mkdirSync(path.join(root, "migrations"), { recursive: true });
  fs.mkdirSync(path.join(root, "src"), { recursive: true });

  // Create the files
  fs.writeFileSync(path.join(root, "README.md"), md);
  fs.writeFileSync(path.join(root, "migrations", "schema.sql"), sql);
  fs.writeFileSync(path.join(root, "src", "index.ts"), source);

  const dependencies = await extractImportsFromSource(source);

  const packageJson: PackageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "wrangler dev src/index.ts",
      deploy: "wrangler deploy --minify src/index.ts",
      migrate: "wrangler d1 migrations apply my-database --local",
      "migrate:prod": "wrangler d1 migrations apply my-database",
    },
    dependencies: {
      hono: "^3.12.7",
    },
    devDependencies: {
      "@cloudflare/workers-types": "^4.20231218.0",
      wrangler: "^3.22.0",
    },
  };

  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  console.info("\nInstalling dependencies:");
  for (const dependency in packageJson.dependencies)
    console.info(`- ${chalk.cyan(dependency)}`);

  if (!skipCodePackage)
    for (const dependency of dependencies)
      console.info(`- ${chalk.cyan(dependency)}`);

  console.info("\nInstalling devDependencies:");
  for (const dependency in packageJson.devDependencies)
    console.info(`- ${chalk.cyan(dependency)}`);

  console.info();

  await install(packageManager, skipCodePackage ? [] : dependencies);
};
