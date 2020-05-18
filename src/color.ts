export class Color {
    public readonly name: string;
    public readonly value: number;

    private constructor(name: string, value: number) {
        this.name = name;
        this.value = value;
    }

    toRGB(): readonly [number, number, number] {
        return [
            this.value & 0xff,
            this.value >> 8 & 0xff,
            this.value >> 16
        ];
    }

    static withNameAndValue(name: string, value: number): Color {
        return new Color(name, value);
    }
}
