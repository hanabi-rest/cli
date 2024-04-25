import os from "os";
import path from "path";
import { getFiles } from "@/src/helpers/fetch";
import { PackageManager } from "@/src/helpers/get-pkg-manager";
import { install } from "@/src/helpers/install";
import chalk from "chalk";
import fs from "fs-extra";
import { type PackageJson } from "type-fest";
import { extractImportsFromSource } from "@/src/helpers/ast";
import prompts from "prompts";
import { fileURLToPath } from "url";

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
  console.info();

  const { readme, route, migrations, seed, source } = await getFiles(appId);

  if (!readme || !route || !migrations || !source) {
    throw new Error(
      "Failed to fetch files. Your API may be in the process of being generated or may have failed to generate."
    );
  }

  fs.mkdirSync(root, { recursive: true });

  const fileCopyError = (err: NodeJS.ErrnoException | null | undefined) => {
    if (err) {
      console.error("Failed to copy files. Please check permissions.", err);
      process.exit(1);
    }
  };

  fs.copy(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "templates",
      "workers",
      "wrangler.toml"
    ),
    path.join(root, "wrangler.toml"),
    fileCopyError
  );

  fs.copy(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "templates",
      "workers",
      "tsconfig.json"
    ),
    path.join(root, "tsconfig.json"),
    fileCopyError
  );

  fs.copy(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "templates",
      "workers",
      "gitignore"
    ),
    path.join(root, ".gitignore"),
    fileCopyError
  );

  process.chdir(root);

  fs.mkdirSync(path.join(root, "migrations"), { recursive: true });
  fs.mkdirSync(path.join(root, "src"), { recursive: true });

  // Create the files
  fs.writeFileSync(path.join(root, "README.md"), readme);
  fs.writeFileSync(path.join(root, "migrations", "schema.sql"), migrations);
  seed && fs.writeFileSync(path.join(root, "seed.sql"), seed);
  fs.writeFileSync(path.join(root, "route.md"), route);
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

  console.info("Installing dependencies:");
  for (const dependency in packageJson.dependencies)
    console.info(`- ${chalk.cyan(dependency)}`);

  if (!skipCodePackage)
    for (const dependency of dependencies)
      console.info(`- ${chalk.cyan(dependency)}`);

  console.info("\nInstalling devDependencies:");
  for (const dependency in packageJson.devDependencies)
    console.info(`- ${chalk.cyan(dependency)}`);

  console.info();

  if (!skipCodePackage) {
    const res = await prompts({
      type: "confirm",
      name: "install",
      message: "Are you sure you want to install the above dependencies?",
      initial: true,
    });

    if (!res.install) {
      console.info("Skip...");
      return;
    }
  }

  await install(packageManager, skipCodePackage ? [] : dependencies);
};
