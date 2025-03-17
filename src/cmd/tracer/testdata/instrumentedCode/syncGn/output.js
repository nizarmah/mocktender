function* fibonacciGenerator(n: number): IterableIterator<number> {
    function* __fn(n: number): IterableIterator<number> {
        let a: number = 0;
        let b: number = 1;
        for (let i = 0; i <= n; i++) {
            yield a;
            const temp = a + b;
            a = b;
            b = temp;
        }
    }
    return yield* __tsg("fibonacciGenerator", __fn, this, [
        n
    ]);
}
export function main() {
    function __fn() {
        const gen = fibonacciGenerator(10);
        console.log({
            msg: "syncGn.main.fibonacciGenerator.done",
            result: Array.from(gen).join(", "),
        });
    }
    return __tsf("main", __fn, this, []);
}
