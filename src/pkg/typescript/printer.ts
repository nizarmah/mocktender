import { createPrinter, type SourceFile } from "typescript"

export function printSourceFile (
  sourceFile: SourceFile
): string {
  try {
    const printer = createPrinter()

    return printer.printFile(sourceFile)
  } catch (err) {
    throw new Error(
      `Failed to print source file: ${sourceFile.fileName}\n` +
      `Error: ${String(err)}`
    )
  }
}
