function fibonacci(n: number, mem: number[]): number {
    function fibonacci(n: number, mem: number[]): number {
        if (mem[n] !== undefined) {
            return mem[n];
        }
        if (n <= 1) {
            mem[n] = n;
            return mem[n];
        }
        const a = fibonacci(n - 2, mem);
        const b = fibonacci(n - 1, mem);
        mem[n] = a + b;
        return mem[n];
    }
    return __tsf(fibonacci, __filename, this, [
        n,
        mem
    ]);
}
const fibonacciSequence = (n: number): number[] => {
    function fibonacciSequence(n: number): number[] {
        const mem: number[] = [];
        fibonacci(n, mem);
        return mem;
    }
    return __tsf(fibonacciSequence, __filename, this, [
        n
    ]);
};
export function main() {
    function main() {
        const sequence = fibonacciSequence(10);
        console.log({
            msg: "syncFn.main.fibonacciSequence.done",
            result: sequence.join(", "),
        });
    }
    return __tsf(main, __filename, this, []);
}
