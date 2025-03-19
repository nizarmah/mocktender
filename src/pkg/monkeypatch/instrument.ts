import {
  factory,
  isArrowFunction,
  isExpression,
  isFunctionDeclaration,
  isIdentifier,
  isObjectBindingPattern,
  isOmittedExpression,
  isVariableStatement,
  SyntaxKind
} from "typescript"
import type {
  ArrowFunction,
  BindingName,
  BindingPattern,
  Block,
  Expression,
  FunctionDeclaration,
  Identifier,
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
    // Try to wrap each statement.
    ...maybeWrapStatements(sourceFile.statements),
  ]

  return factory.updateSourceFile(
    sourceFile,
    statements,
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
      wrapArrowFunction(
        node,
        initializer
      )
    )
  }

  return node
}

// Wraps a function declaration.
function wrapFunctionDeclaration (
  node: FunctionDeclaration
): FunctionDeclaration {
  // Ignore anonymous functions.
  if (!node.name?.text) {
    return node
  }

  // Skip if the function body is empty.
  const body = node.body
  if (!body || body.statements.length === 0) {
    return node
  }

  const isAsync = hasAsyncModifier(node.modifiers)
  const isGenerator = node.asteriskToken !== undefined

  const innerFn = factory.createFunctionDeclaration(
    node.modifiers?.filter((modifier) => {
      return modifier.kind !== SyntaxKind.ExportKeyword
    }),
    node.asteriskToken,
    node.name,
    node.typeParameters,
    node.parameters,
    node.type,
    node.body
  )

  // Create inner function invoker.
  const invoker = createInvokerStatement(
    node.name,
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
        invoker
      ]
    )
  )

  return wrapped
}

// Wraps an arrow function.
function wrapArrowFunction (
  declaration: VariableDeclaration,
  node: ArrowFunction
): ArrowFunction {
  // Ignore anonymous functions and bindings.
  if (
    !isIdentifier(declaration.name) ||
    !declaration.name.text
  ) {
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
  const innerFn = factory.createFunctionDeclaration(
    node.modifiers,
    node.asteriskToken,
    declaration.name,
    node.typeParameters,
    node.parameters,
    node.type,
    block
  )

  // Create inner function invoker.
  const invoker = createInvokerStatement(
    declaration.name,
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
  fnName: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean,
  isGenerator: boolean
) {
  if (isGenerator) {
    return createGeneratorInvokerStatement(fnName, parameters, isAsync)
  }

  return createFunctionInvokerStatement(fnName, parameters, isAsync)
}

// Creates a non-generator function invoker statement.
function createFunctionInvokerStatement (
  fnName: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean
) {
  const invoker = createFunctionInvokerExpression(
    isAsync ? traceAsyncFunction : traceSyncFunction,
    fnName,
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
  fnName: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined,
  isAsync: boolean
) {
  const invoker = createFunctionInvokerExpression(
    isAsync ? traceAsyncGenerator : traceSyncGenerator,
    fnName,
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
  fnName: Identifier,
  parameters: NodeArray<ParameterDeclaration> | undefined
) {
  const callExpression = factory.createCallExpression(
    tracer,
    undefined,
    [
      fnName,
      factory.createIdentifier("__filename"),
      factory.createThis(),
      factory.createArrayLiteralExpression(
        parameters?.map((param) => createBindingNameExpression(param.name)),
        true
      )
    ]
  )

  return callExpression
}

// Creates an expression from a parameter, that's used when invoking a function.
function createBindingNameExpression (
  node: BindingName
): Expression {
  // If the parameter is an identifier, return it.
  // eg. `function test(a: number) { ... }` -> `a`
  if (isIdentifier(node)) {
    return node
  }

  // Otherwise, it's a binding pattern.
  // eg. `function test({ a: name, b }: { a: number, b: string }) { ... }` -> `{ a: name, b }`
  // eg. `function test([a, b]: [number, string]) { ... }` -> `[a, b]`
  return createBindingPatternExpression(node)
}

// Creates an expression from a binding pattern, to reference each element when invoking a function.
function createBindingPatternExpression (
  bindingPattern: BindingPattern
): Expression {
  // eg. `function test({ a: name, b }: { a: number, b: string }) { ... }` -> `{ a: name, b }`
  if (isObjectBindingPattern(bindingPattern)) {
    return factory.createObjectLiteralExpression(
      bindingPattern.elements.map((elem) => {
        // eg. { a }
        if (elem.propertyName === undefined) {
          return factory.createShorthandPropertyAssignment(
            // If there's no property name, there's no binding element
            // A binding element is { a: { b, c } } or { a: [b, c] }
            // So, we can safely cast to Identifier here.
            elem.name as Identifier,
            undefined
          )
        }

        // eg. { a: name }
        return factory.createPropertyAssignment(
          elem.propertyName,
          createBindingNameExpression(elem.name)
        )
      })
    )
  }

  // eg. `function test([a, b]: [number, string]) { ... }` -> `[a, b]`
  return factory.createArrayLiteralExpression(
    bindingPattern.elements.map((elem) => {
      // If an element is omitted, we return it because order is important.
      // We cannot skip any element, otherwise we reference the wrong parameter.
      if (isOmittedExpression(elem)) {
        return factory.createOmittedExpression()
      }

      // Otherwise, it's a binding name.
      return createBindingNameExpression(elem.name)
    })
  )
}
