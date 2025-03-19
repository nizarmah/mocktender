function* fibonacciGenerator(n: number): IterableIterator<number> {
    function* fibonacciGenerator(n: number): IterableIterator<number> {
        let a: number = 0;
        let b: number = 1;
        for (let i = 0; i <= n; i++) {
            yield a;
            const temp = a + b;
            a = b;
            b = temp;
        }
    }
    return yield* __tsg(fibonacciGenerator, __filename, this, [
        n
    ]);
}
export function main() {
    function main() {
        const gen = fibonacciGenerator(10);
        return Array.from(gen);
    }
    return __tsf(main, __filename, this, []);
}
