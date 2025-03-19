const createResolver = (ms: number, val: unknown) => { function createResolver(ms: number, val: unknown) { return (resolve: (v: unknown) => void) => setTimeout(() => resolve(val), ms); } return __tsf(createResolver, __filename, this, [
    ms,
    val
]); };
const sleep = (ms: number, val: unknown) => { function sleep(ms: number, val: unknown) { return new Promise(createResolver(ms, val)); } return __tsf(sleep, __filename, this, [
    ms,
    val
]); };
async function resolveFn(ms: number, val: number) {
    async function resolveFn(ms: number, val: number) {
        return sleep(ms, val);
    }
    return await __taf(resolveFn, __filename, this, [
        ms,
        val
    ]);
}
const resolveArrow = async (ms: number, val: string) => {
    async function resolveArrow(ms: number, val: string) {
        return sleep(ms, val);
    }
    return await __taf(resolveArrow, __filename, this, [
        ms,
        val
    ]);
};
export async function main() {
    async function main() {
        console.log({
            msg: "asyncFn.main.firstPromise.resolved",
            result: await resolveFn(1000, 123)
        });
        console.log({
            msg: "asyncFn.main.secondPromise.resolved",
            result: await resolveArrow(1000, "456")
        });
    }
    return await __taf(main, __filename, this, []);
}
