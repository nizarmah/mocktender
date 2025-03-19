type Greeting = {
  greeter: string
  greeted: string
  weather: string
}

function createGreeting({ greeter: name, greeted, weather }: Greeting): string {
  return `Hello, ${greeted}. I am ${name}. Is the weather ${weather} today?`
}

function swap([a, b]: [string, string]): [string, string] {
  return [b, a]
}

export function main(): [string, string] {
  const greetingResult = createGreeting({
    greeter: "John",
    greeted: "world",
    weather: "sunny",
  })

  const swapResult = swap(["Hello", "world"]).join(", ")

  return [
    greetingResult,
    swapResult,
  ]
}