import { Project } from "ts-morph";

export async function extractImportsFromSource(
  source: string
): Promise<string[]> {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("tempFile.ts", source);

  const imports = sourceFile
    .getImportDeclarations()
    .map((imp) => imp.getModuleSpecifierValue())
    .filter((specifier) => specifier !== "hono");

  return imports;
}
