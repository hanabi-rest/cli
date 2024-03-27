import xdgAppPaths from "xdg-app-paths";
import path from "node:path";
import { mkdirSync, chmodSync, writeFileSync, readFileSync } from "node:fs";
import TOML from "@iarna/toml";

export const USER_AUTH_CONFIG_FILE = "config.toml";

type AuthConfig = {
    api_token: string;
};

export function getGlobalConfigPath() {

    return xdgAppPaths(".hanabi").config();
}

export function writeAuthConfigFile(config: AuthConfig) {
    const authConfigFilePath = path.join(
        getGlobalConfigPath(),
        USER_AUTH_CONFIG_FILE
    );
    mkdirSync(path.dirname(authConfigFilePath), {
        recursive: true,
    });
    writeFileSync(
        path.join(authConfigFilePath),
        TOML.stringify(config as TOML.JsonMap),
        { encoding: "utf-8" }
    );

    chmodSync(path.join(authConfigFilePath), 0o600);

}
export function readConfig() {
    const authConfigFilePath = path.join(
        getGlobalConfigPath(),
        USER_AUTH_CONFIG_FILE
    );
    try {
        const normalizedInput = readFileSync(authConfigFilePath, { encoding: "utf-8" }).replace(/\r\n/g, "\n");

        return TOML.parse(normalizedInput) as AuthConfig;
    } catch (e) {
        return null;
    }
}