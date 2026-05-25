import type { CalendarType, CalendarDate, MayanDate } from './types';
import { Solar, Lunar } from 'lunar-javascript';

const GREGORIAN_EPOCH = 1721424.5;
const PERSIAN_EPOCH = 1948320.5;

function gregorianToJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function julianDayToGregorian(jd: number): { year: number; month: number; day: number } {
  const a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10)
  };
}

export function gregorianToLunar(date: { year: number; month: number; day: number }): { year: number; month: number; day: number; isLeap: boolean } {
  try {
    const solar = Solar.fromYmd(date.year, date.month, date.day);
    const lunar = solar.getLunar();
    return {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      isLeap: lunar.isLeap()
    };
  } catch (e) {
    const baseDate = new Date(date.year, date.month - 1, date.day);
    const lunarYear = date.year - (date.month < 3 ? 1 : 0);
    return {
      year: lunarYear,
      month: ((date.month + 9) % 12) + 1,
      day: ((date.day + 15) % 30) + 1,
      isLeap: false
    };
  }
}

export function lunarToGregorian(lunar: { year: number; month: number; day: number; isLeap?: boolean }): { year: number; month: number; day: number } {
  try {
    const lunarDate = Lunar.fromYmd(lunar.year, lunar.month, lunar.day);
    const solar = lunarDate.getSolar();
    return {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay()
    };
  } catch (e) {
    const jd = gregorianToJulianDay(lunar.year + 2, lunar.month, lunar.day);
    const result = julianDayToGregorian(jd - 30);
    return result;
  }
}

const MAYAN_CORRELATION = 584283;

export function gregorianToMayan(date: { year: number; month: number; day: number }): MayanDate {
  const jd = gregorianToJulianDay(date.year, date.month, date.day);
  const mayanDay = Math.floor(jd - MAYAN_CORRELATION);

  let remaining = mayanDay;

  const baktun = Math.floor(remaining / 144000);
  remaining %= 144000;

  const katun = Math.floor(remaining / 7200);
  remaining %= 7200;

  const tun = Math.floor(remaining / 360);
  remaining %= 360;

  const uinal = Math.floor(remaining / 20);
  remaining %= 20;

  const kin = remaining;

  return {
    baktun: baktun % 14,
    katun,
    tun,
    uinal,
    kin
  };
}

export function mayanToGregorian(mayan: MayanDate): { year: number; month: number; day: number } {
  const mayanDay = mayan.baktun * 144000 + mayan.katun * 7200 + mayan.tun * 360 + mayan.uinal * 20 + mayan.kin;
  const jd = mayanDay + MAYAN_CORRELATION;
  return julianDayToGregorian(jd);
}

export function gregorianToPersian(date: { year: number; month: number; day: number }): { year: number; month: number; day: number } {
  const jd = gregorianToJulianDay(date.year, date.month, date.day);
  const depoch = jd - PERSIAN_EPOCH;
  const cycle = Math.floor(depoch / 1029983);
  const cyear = depoch % 1029983;

  let ycycle: number;
  if (cyear == 1029982) {
    ycycle = 2820;
  } else {
    const aux1 = Math.floor(cyear / 366);
    const aux2 = cyear % 366;
    ycycle = Math.floor((2134 * aux1 + 2816 * aux2 + 2815) / 1028522) + aux1 + 1;
  }

  const year = ycycle + 2820 * cycle + 474;
  const yday = Math.floor(jd - gregorianToJulianDay(year, 1, 1) - PERSIAN_EPOCH + 1) + 1;

  const month = yday <= 186 ? Math.ceil(yday / 31) : Math.ceil((yday - 6) / 30);
  const day = jd - gregorianToJulianDay(year, month, 1) + 1;

  return {
    year: year - (year > 0 ? 0 : 1),
    month,
    day
  };
}

export function persianToGregorian(persian: { year: number; month: number; day: number }): { year: number; month: number; day: number } {
  let year = persian.year;
  if (year >= 0) year += 1;

  const epbase = year - 474;
  const epyear = 474 + (epbase % 2820);

  let dayOfYear: number;
  if (persian.month <= 7) {
    dayOfYear = (persian.month - 1) * 31 + persian.day - 1;
  } else {
    dayOfYear = 6 * 31 + (persian.month - 7) * 30 + persian.day - 1;
  }

  const jd = dayOfYear + PERSIAN_EPOCH + (epyear * 365 + Math.floor((epbase - epbase % 2820) / 2820) * 1029983 + Math.floor((epyear * 31 + 20) / 128) + Math.floor((epyear - 1) / 2820) * 1029983);

  return julianDayToGregorian(jd);
}

export function convertDate(date: CalendarDate, targetCalendar: CalendarType): CalendarDate {
  let intermediate: { year: number; month: number; day: number } = { year: date.year, month: date.month, day: date.day };

  if (date.calendar === 'lunar') {
    intermediate = lunarToGregorian({ year: date.year, month: date.month, day: date.day });
  } else if (date.calendar === 'mayan') {
    intermediate = mayanToGregorian({ baktun: date.year, katun: 0, tun: 0, uinal: date.month, kin: date.day });
  } else if (date.calendar === 'persian') {
    intermediate = persianToGregorian({ year: date.year, month: date.month, day: date.day });
  }

  if (targetCalendar === 'gregorian') {
    return { year: intermediate.year, month: intermediate.month, day: intermediate.day, calendar: 'gregorian' };
  } else if (targetCalendar === 'lunar') {
    const lunar = gregorianToLunar(intermediate);
    return { year: lunar.year, month: lunar.month, day: lunar.day, calendar: 'lunar' };
  } else if (targetCalendar === 'mayan') {
    const mayan = gregorianToMayan(intermediate);
    return { year: mayan.baktun, month: mayan.uinal, day: mayan.kin, calendar: 'mayan' };
  } else if (targetCalendar === 'persian') {
    const persian = gregorianToPersian(intermediate);
    return { year: persian.year, month: persian.month, day: persian.day, calendar: 'persian' };
  }

  return { ...intermediate, calendar: targetCalendar };
}

export function convertAllCalendars(date: CalendarDate) {
  return {
    gregorian: convertDate(date, 'gregorian'),
    lunar: convertDate(date, 'lunar'),
    mayan: convertDate(date, 'mayan'),
    persian: convertDate(date, 'persian')
  };
}

export function detectConflicts(date: CalendarDate): string[] {
  const conflicts: string[] = [];

  if (date.calendar === 'gregorian') {
    if (date.year === 1582 && date.month === 10 && date.day >= 5 && date.day <= 14) {
      conflicts.push('calendar_gap_1582');
    }
  }

  if (date.calendar === 'lunar') {
    if (date.month === 12 && date.day === 31) {
      conflicts.push('lunar_leap_year_check');
    }
  }

  if (date.calendar === 'mayan') {
    if (date.year === 13 && date.month === 0 && date.day === 0) {
      conflicts.push('mayan_cycle_end');
    }
  }

  if (date.calendar === 'persian') {
    if (date.month === 12 && date.day === 30) {
      conflicts.push('persian_leap_day');
    }
  }

  return conflicts;
}

export function calculatePrecisionLoss(sourceCalendar: CalendarType, targetCalendar: CalendarType): number {
  const precisionMap: Record<string, number> = {
    'gregorian-gregorian': 0,
    'lunar-lunar': 0,
    'mayan-mayan': 0,
    'persian-persian': 0,
    'gregorian-lunar': 0.5,
    'lunar-gregorian': 0.5,
    'gregorian-mayan': 1.0,
    'mayan-gregorian': 1.0,
    'gregorian-persian': 0.8,
    'persian-gregorian': 0.8,
    'lunar-mayan': 2.0,
    'mayan-lunar': 2.0,
    'lunar-persian': 2.5,
    'persian-lunar': 2.5,
    'mayan-persian': 2.5,
    'persian-mayan': 2.5
  };

  return precisionMap[`${sourceCalendar}-${targetCalendar}`] || 3.0;
}

export function applyTimezone(date: CalendarDate, offsetHours: number): CalendarDate {
  const d = new Date(date.year, date.month - 1, date.day, Math.abs(offsetHours) % 24, 0, 0);
  d.setHours(d.getHours() + offsetHours);

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    calendar: date.calendar
  };
}
