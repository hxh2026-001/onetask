declare module 'lunar-javascript' {
  export class Solar {
    constructor(year: number, month: number, day: number, hour?: number, minute?: number, second?: number);
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number, isLeap?: boolean): Lunar;
    static fromSolar(solar: Solar): Lunar;
    getSolar(): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
    getYearShengXiao(): string;
    getYearGanZhi(): string;
  }
}
