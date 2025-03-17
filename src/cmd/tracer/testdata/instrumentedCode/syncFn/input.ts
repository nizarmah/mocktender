
function fibonacci(n: number, mem: number[]): number {
  if (mem[n] !== undefined) {
    return mem[n]
  }

  if (n <= 1) {
    mem[n] = n
    return mem[n]
  }

  const a = fibonacci(n - 2, mem)
  const b = fibonacci(n - 1, mem)

  mem[n] = a + b

  return mem[n]
}

const fibonacciSequence = (n: number): number[] => {
  const mem: number[] = []

  fibonacci(n, mem)

  return mem
}

export function main() {
  const sequence = fibonacciSequence(10)

  console.log({
    msg: "syncFn.main.fibonacciSequence.done",
    result: sequence.join(", "),
  })
}
