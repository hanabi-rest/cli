import fetch from "node-fetch";
import { readConfig } from "./config-path";

const API_ROOT = process.env.API_ROOT || "https://api.hanabi.rest";

const config = readConfig();

const handleResponseStatus = (status: number) => {
  const messages: { [key: number]: string } = {
    404: "Application not found.",
    403: config?.api_token ? "You cannot access this application. Please check if the access token is set correctly." : "You need to set an access token to access this application. Please set the token with `@hanabi.rest/cli config set`.",
  };

  if (status !== 200) {
    console.error(messages[status] || "Failed to fetch application. Please try again later.");
    process.exit(1);
  }
};

export async function getFiles(version_id: string) {

  const headers: { "Content-Type": string; Authorization?: string } = {
    "Content-Type": "application/json",
  };

  if (config?.api_token) {
    headers.Authorization = `Bearer ${config.api_token}`;
  }

  const res = await fetch(
    `${API_ROOT}/applications/versions/${version_id}/files`, {
    headers
  }
  );

  handleResponseStatus(res.status);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const filesData: any = await res.json();

  return {
    readme: filesData["guide.md"],
    route: filesData["route.md"],
    migrations: filesData["schema.sql"],
    seed: filesData["dummy.sql"],
    source: filesData["index.ts"],
  };
}
