const createResolver = <T>(ms: number, val: T) => { function createResolver<T>(ms: number, val: T) { return (resolve: (v: T) => void) => setTimeout(() => resolve(val), ms); } return __tsf(createResolver, __filename, this, [
    ms,
    val
]); };
const sleep = <T>(ms: number, val: T): Promise<T> => { function sleep<T>(ms: number, val: T): Promise<T> { return new Promise(createResolver(ms, val)); } return __tsf(sleep, __filename, this, [
    ms,
    val
]); };
async function resolveFn(ms: number, val: number): Promise<number> {
    async function resolveFn(ms: number, val: number): Promise<number> {
        return sleep(ms, val);
    }
    return await __taf(resolveFn, __filename, this, [
        ms,
        val
    ]);
}
const resolveArrow = async (ms: number, val: string): Promise<string> => {
    async function resolveArrow(ms: number, val: string): Promise<string> {
        return sleep(ms, val);
    }
    return await __taf(resolveArrow, __filename, this, [
        ms,
        val
    ]);
};
export async function main(): Promise<[
    number,
    string
]> {
    async function main(): Promise<[
        number,
        string
    ]> {
        return [
            await resolveFn(1000, 123),
            await resolveArrow(1000, "456"),
        ];
    }
    return await __taf(main, __filename, this, []);
}
