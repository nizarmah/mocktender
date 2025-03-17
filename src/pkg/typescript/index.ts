import { basename } from 'node:path'
import {
  createPrinter,
  createSourceFile as createSourceFileInternal,
  ScriptTarget,
  ScriptKind,
} from 'typescript'
import type { SourceFile } from 'typescript'

export function createSourceFile (
  path: string,
  content: string
): SourceFile {
  try {
    return createSourceFileInternal(
      basename(path),
      content,
      ScriptTarget.ESNext,
      // This has been set to false because of circular reference serialization.
      // TODO: Handle circular reference serialization.
      false,
      ScriptKind.TS
    )
  } catch (err) {
    throw new Error(
      `Failed to parse source file: ${path}\n` +
      `Error: ${String(err)}`
    )
  }
}

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
