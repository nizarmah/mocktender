
const createResolver = <T>(ms: number, val: T) =>
  (resolve: (v: T) => void) => setTimeout(() => resolve(val), ms)

const sleep = <T>(ms: number, val: T): Promise<T> =>
  new Promise(createResolver(ms, val))

async function resolveFn(ms: number, val: number): Promise<number> {
  return sleep(ms, val)
}

const resolveArrow = async (ms: number, val: string): Promise<string> => {
  return sleep(ms, val)
}

export async function main(): Promise<[number, string]> {
  return [
    await resolveFn(1000, 123),
    await resolveArrow(1000, "456"),
  ]
}
