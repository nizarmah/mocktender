import {
  factory,
  isArrowFunction,
  isExpression,
  isFunctionDeclaration,
  isVariableStatement,
  SyntaxKind
} from "typescript"
import type {
  ArrowFunction,
  Block,
  FunctionDeclaration,
  Identifier,
  Modifier,
  ModifierLike,
  NodeArray,
  ParameterDeclaration,
  SourceFile,
  Statement,
  VariableDeclaration,
  VariableStatement
} from "typescript"

const traceSyncFunction = factory.createIdentifier("__tsf")
const traceAsyncFunction = factory.createIdentifier("__taf")
const traceSyncGenerator = factory.createIdentifier("__tsg")
const traceAsyncGenerator = factory.createIdentifier("__tag")

// Instruments function inputs and outputs.
export const instrument = (
  sourceFile: SourceFile
): SourceFile => {
  const statements = [
    // Import instrumentation library.
    ...importInstrumentationLib(),
    // Try to wrap each statement.
    ...maybeWrapStatements(sourceFile.statements),
  ]

  return factory.updateSourceFile(
    sourceFile,
    statements,
  )
}

// Imports the instrumentation library.
function * importInstrumentationLib () {
  // import { __ts, __ta, __tg } from "./src/pkg/instrumentation/lib.ts"
  yield factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          false,
          undefined,
          traceSyncFunction,
        ),
        factory.createImportSpecifier(
          false,
          undefined,
          traceAsyncFunction,
        ),
        factory.createImportSpecifier(
          false,
          undefined,
          traceSyncGenerator,
        ),
        factory.createImportSpecifier(
          false,
          undefined,
          traceAsyncGenerator,
        ),
      ]),
    ),
    // TODO: Fix relative import.
    factory.createStringLiteral("../../pkg/instrumentation/lib.ts"),
    undefined,
  )
}

// Generate maybe-wrapped statements, from given statements.
function * maybeWrapStatements (
  nodes: NodeArray<Statement>
): IterableIterator<Statement> {
  for (const node of nodes) {
    // Depth-first search. Can return multiple statements per iteration.
    yield * maybeWrapStatement(node)
  }
}

// Try to wrap a statement if it's supported.
function * maybeWrapStatement (
  node: Statement
): IterableIterator<Statement> {
  // TODO: Add support for more function types.

  // Function declaration.
  if (isFunctionDeclaration(node)) {
    yield wrapFunctionDeclaration(node)
    return
  }

  // Possibly an arrow function.
  if (isVariableStatement(node)) {
    yield * maybeWrapVariableStatement(node)
    return
  }

  yield node
}

// Try to wrap a variable statement, if it's supported.
function * maybeWrapVariableStatement (
  node: VariableStatement
): IterableIterator<Statement> {
  const declarations: NodeArray<VariableDeclaration> =
    factory.createNodeArray(
      node.declarationList.declarations.map(
        (decl) => maybeWrapVariableDeclaration(decl))
    )

  const updated = factory.updateVariableStatement(
    node,
    node.modifiers,
    factory.updateVariableDeclarationList(
      node.declarationList,
      factory.createNodeArray(declarations)
    ),
  )

  yield updated
}

// Try to wrap a variable declaration, if it's supported.
function maybeWrapVariableDeclaration (
  node: VariableDeclaration
): VariableDeclaration {
  const initializer = node.initializer
  if (!initializer) {
    return node
  }

  if (isArrowFunction(initializer)) {
    return factory.updateVariableDeclaration(
      node,
      node.name,
      node.exclamationToken,
      node.type,
      wrapArrowFunction(node.name.getText(), initializer)
    )
  }

  return node
}

// Wraps a function declaration.
function wrapFunctionDeclaration (
  node: FunctionDeclaration
): FunctionDeclaration {
  // Get the function name.
  const name = getFunctionDeclarationName(node)
  if (!name) {
    return node
  }

  // Skip if the function body is empty.
  const body = node.body
  if (!body || body.statements.length === 0) {
    return node
  }

  const isAsync = hasAsyncModifier(node.modifiers)
  const isGenerator = node.asteriskToken !== undefined

  // Create inner function.
  const innerFnName = factory.createIdentifier("__fn")
  const innerFn = factory.createFunctionDeclaration(
    excludeExportModifier(node.modifiers),
    node.asteriskToken,
    innerFnName,
    node.typeParameters,
    node.parameters,
    node.type,
    node.body
  )

  // Create inner function invoker.
  const invoker = createInvokerStatement(
    name,
    innerFnName,
    node.parameters,
    isAsync,
    isGenerator
  )

  // Replace the original body with the wrapped body.
  const wrapped = factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    node.parameters,
    node.type,
    factory.updateBlock(
      node.body,
      [
        innerFn,
        invoker,
      ]
    )
  )

  return wrapped
}

// Wraps an arrow function.
function wrapArrowFunction (
  name: string,
  node: ArrowFunction
): ArrowFunction {
  if (!name) {
    return node
  }

  // Skip if the function body is empty.
  const body = node.body
  if (!body) {
    return node
  }

  const block: Block = isExpression(body)
    ? factory.createBlock([
      factory.createReturnStatement(body)
    ])
    : body

  const isAsync = hasAsyncModifier(node.modifiers)

  // Create inner function.
  const innerFnName = factory.createIdentifier("__fn")
  const innerFn = factory.createFunctionDeclaration(
    excludeExportModifier(node.modifiers),
    undefined,
    innerFnName,
    node.typeParameters,
    node.parameters,
    node.type,
    block
  )

  // Create inner function invoker.
  const invoker = createInvokerStatement(
    name,
    innerFnName,
    node.parameters,
    isAsync,
    false
  )

  // Replace the original body with the wrapped body.
  const wrapped = factory.updateArrowFunction(
    node,
    node.modifiers,
    node.typeParameters,
    node.parameters,
    node.type,
    node.equalsGreaterThanToken,
    factory.updateBlock(
      block,
      [
        innerFn,
        invoker
      ]
    )
  )

  return wrapped
}

// Gets the function name from a function declaration.
function getFunctionDeclarationName (
  node: FunctionDeclaration
): string {
  return node.name?.text ?? ''
}

// Excludes the export modifier, used by wrapped functions.
function excludeExportModifier<T extends ModifierLike | Modifier> (
  modifiers: NodeArray<T> | undefined
): NodeArray<T> | undefined {
  if (modifiers === undefined) {
    return undefined
  }

  return factory.createNodeArray(
    modifiers.filter((modifier) => {
      return modifier.kind !== SyntaxKind.ExportKeyword
    })
  )
}

// Checks if a node has an async modifier.
function hasAsyncModifier (
  modifiers: NodeArray<ModifierLike> | undefined
): boolean {
  if (modifiers === undefined) {
    return false
  }

  return modifiers.some((modifier) => modifier.kind === SyntaxKind.AsyncKeyword)
}

function createInvokerStatement (
  name: string,
  identifier: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean,
  isGenerator: boolean
) {
  if (isGenerator) {
    return createGeneratorInvokerStatement(name, identifier, parameters, isAsync)
  }

  return createFunctionInvokerStatement(name, identifier, parameters, isAsync)
}

// Creates a non-generator function invoker statement.
function createFunctionInvokerStatement (
  name: string,
  identifier: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean
) {
  const invoker = createFunctionInvokerExpression(
    isAsync ? traceAsyncFunction : traceSyncFunction,
    name,
    identifier,
    parameters
  )

  return factory.createReturnStatement(
    isAsync
      ? factory.createAwaitExpression(invoker)
      : invoker
  )
}

// Creates a generator function invoker statement.
function createGeneratorInvokerStatement (
  name: string,
  identifier: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean
) {
  const invoker = createFunctionInvokerExpression(
    isAsync ? traceAsyncGenerator : traceSyncGenerator,
    name,
    identifier,
    parameters
  )

  return factory.createReturnStatement(
    factory.createYieldExpression(
      factory.createToken(SyntaxKind.AsteriskToken),
      invoker
    )
  )
}

// Creates a function invoker expression, with await if needed.
function createFunctionInvokerExpression (
  tracer: Identifier,
  name: string,
  identifier: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined
) {
  const callExpression = factory.createCallExpression(
    tracer,
    undefined,
    [
      factory.createStringLiteral(name),
      identifier,
      factory.createThis(),
      factory.createArrayLiteralExpression(
        parameters?.map((param) =>
          factory.createIdentifier(param.name.getText())),
        true
      )
    ]
  )

  return callExpression
}
