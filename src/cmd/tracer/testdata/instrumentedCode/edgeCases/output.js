type Greeting = {
    greeter: string;
    greeted: string;
    weather: string;
};
function createGreeting({ greeter: name, greeted, weather }: Greeting): string {
    function createGreeting({ greeter: name, greeted, weather }: Greeting): string {
        return `Hello, ${greeted}. I am ${name}. Is the weather ${weather} today?`;
    }
    return __tsf(createGreeting, __filename, this, [
        { greeter: name, greeted, weather }
    ]);
}
function swap([a, b]: [
    string,
    string
]): [
    string,
    string
] {
    function swap([a, b]: [
        string,
        string
    ]): [
        string,
        string
    ] {
        return [b, a];
    }
    return __tsf(swap, __filename, this, [
        [a, b]
    ]);
}
export function main() {
    function main() {
        console.log({
            msg: "edgeCases.main.createGreeting.done",
            result: createGreeting({
                greeter: "John",
                greeted: "world",
                weather: "sunny",
            }),
        });
        console.log({
            msg: "edgeCases.main.swap.done",
            result: swap(["Hello", "world"]),
        });
    }
    return __tsf(main, __filename, this, []);
}
