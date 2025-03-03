import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import {
  createSourceFile,
  ScriptTarget,
  ScriptKind,
  type SourceFile
} from 'typescript'

export function readSourceFile (
  path: string
): SourceFile {
  const content = readContent(path)

  try {
    return createSourceFile(
      basename(path),
      content,
      ScriptTarget.ESNext,
      true,
      ScriptKind.TS
    )
  } catch (err) {
    throw new Error(
      `Failed to parse source file: ${path}\n` +
      `Error: ${String(err)}`
    )
  }
}

const readContent = (path: string): string => {
  try {
    return readFileSync(path, "utf-8")
  } catch (err) {
    throw new Error(
      `Failed to read file: ${path}\n` +
      `Error: ${String(err)}`
    )
  }
}
