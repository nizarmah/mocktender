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

export function main() {
  console.log({
    msg: "edgeCases.main.createGreeting.done",
    result: createGreeting({
      greeter: "John",
      greeted: "world",
      weather: "sunny",
    }),
  })

  console.log({
    msg: "edgeCases.main.swap.done",
    result: swap(["Hello", "world"]),
  })
}