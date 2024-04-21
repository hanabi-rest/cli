import { extractImportsFromSource } from "../../src/helpers/ast";
import { describe, it, expect } from "vitest";

describe("extractImportsFromSource", () => {
  it("extracts import specifiers from source", async () => {
    const source = `
        import { createPublicClient, http } from 'viem'
        import { mainnet } from 'viem/chains'
        import type { Tool } from "@anthropic-ai/sdk/resources/beta/tools/messages";
        import Anthropic from "@anthropic-ai/sdk";

        const client = createPublicClient({ 
        chain: mainnet, 
        transport: http(), 
        }) 
    `;
    const imports = await extractImportsFromSource(source);

    expect(imports).toEqual([
      "viem",
      "@anthropic-ai/sdk",
    ]);
  });

  it('excludes "hono" from the import specifiers', async () => {
    const source = `
      import { Hono } from "hono";
      import { Axios } from "axios";
    `;

    const imports = await extractImportsFromSource(source);

    expect(imports).toEqual([
      "axios",
    ]);
  })

  it('returns an empty array when there are no imports', async () => {
    const source = "const number = 1;";
    const imports = await extractImportsFromSource(source);
    expect(imports).toHaveLength(0);
  });
});
