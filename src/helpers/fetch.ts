import fetch from "node-fetch";

const API_ROOT = "http://localhost:8989";

export async function getFiles(application_id: string) {
  const res = await fetch(`${API_ROOT}/applications/${application_id}/versions`);

  if (res.status === 404) {
    console.error("Application not found. Please make sure it is published.");
    process.exit(1);
  } else if (res.status !== 200) {
    console.error("Failed to fetch application. Please try again later.");
    process.exit(1);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const data: any = await res.json();

  const files = await fetch(`${API_ROOT}/applications/${application_id}/versions/${data[0].id}/files`);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const filesData: any = await files.json();

  return { md: filesData["route.md"], sql: filesData["schema.sql"], source: filesData["index.ts"] };
}
