import { basename } from 'node:path'
import {
  createPrinter,
  createSourceFile as createSourceFileInternal,
  ScriptTarget,
  ScriptKind,
} from 'typescript'
import type { SourceFile } from 'typescript'

import { instrument } from "../monkeypatch/instrument.ts"

// instrumentSource adds tracing to the source code.
/** @bridge `cmd/tracer` integration and `pkg/monkeypatch` unit. */
export function instrumentSource(
  sourcePath: string,
  sourceText: string
): string {
  // Don't trace the tracing lib, otherwise we'll get infinite recursion.
  // This is a temporary hack until we use dependency injection for tracing lib.
  if (sourcePath.endsWith("instrumenter/lib.ts")) {
    return sourceText
  }

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
