import { basename } from 'node:path'
import {
  createPrinter,
  createSourceFile as createSourceFileInternal,
  ScriptTarget,
  ScriptKind,
} from 'typescript'
import type { SourceFile } from 'typescript'

import { instrument } from "./monkeypatch.ts"

// instrumentSource adds tracing to the source code.
/** @bridge `cmd/recorder` integration and `pkg/monkeypatch` unit. */
export function instrumentSource(
  sourcePath: string,
  sourceText: string
): string {
  const source = createSourceFile(sourcePath, sourceText)
  const instrumented = instrument(source)

  return printSourceFile(instrumented)
}

function createSourceFile (
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

function printSourceFile (
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
