import { Project } from "ts-morph";

export async function extractImportsFromSource(sourceCode: string): Promise<string[]> {
  const project = new Project({
    useInMemoryFileSystem: true
  });

  const sourceFile = project.createSourceFile("tempFile.ts", sourceCode);

  const imports = sourceFile.getImportDeclarations()
    .map(importDeclaration => importDeclaration.getModuleSpecifier().getLiteralText())
    .filter(specifier => specifier !== "hono");

  const normalizedModules = imports.map((name) => {
    const parts = name.split('/');
    if (parts[0].startsWith('@')) {
      return parts.length > 2 ? `${parts[0]}/${parts[1]}` : name;
    }
    return parts[0];
  });

  return Array.from(new Set(normalizedModules));
}
