
const createResolver = (ms: number, val: unknown) =>
  (resolve: (v: unknown) => void) => setTimeout(() => resolve(val), ms)

const sleep = (ms: number, val: unknown) =>
  new Promise(createResolver(ms, val))

async function resolveFn(ms: number, val: number) {
  return sleep(ms, val)
}

const resolveArrow = async (ms: number, val: string) => {
  return sleep(ms, val)
}

export async function main() {
  console.log({
    msg: "asyncFn.main.firstPromise.resolved",
    result: await resolveFn(1000, 123)
  })

  console.log({
    msg: "asyncFn.main.secondPromise.resolved",
    result: await resolveArrow(1000, "456")
  })
}
