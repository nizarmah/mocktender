const createResolver = (ms: number, val: unknown) => { function __fn(ms: number, val: unknown) { return (resolve: (v: unknown) => void) => setTimeout(() => resolve(val), ms); } return __tsf("createResolver", __fn, this, [
    ms,
    val
]); };
const sleep = (ms: number, val: unknown) => { function __fn(ms: number, val: unknown) { return new Promise(createResolver(ms, val)); } return __tsf("sleep", __fn, this, [
    ms,
    val
]); };
async function resolveFn(ms: number, val: number) {
    async function __fn(ms: number, val: number) {
        return sleep(ms, val);
    }
    return await __taf("resolveFn", __fn, this, [
        ms,
        val
    ]);
}
const resolveArrow = async (ms: number, val: string) => {
    async function __fn(ms: number, val: string) {
        return sleep(ms, val);
    }
    return await __taf("resolveArrow", __fn, this, [
        ms,
        val
    ]);
};
export async function main() {
    async function __fn() {
        console.log({
            msg: "asyncFn.main.firstPromise.resolved",
            result: await resolveFn(1000, 123)
        });
        console.log({
            msg: "asyncFn.main.secondPromise.resolved",
            result: await resolveArrow(1000, "456")
        });
    }
    return await __taf("main", __fn, this, []);
}
