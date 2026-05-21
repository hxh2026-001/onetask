export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

export function raToDeg(hours: number, minutes: number, seconds: number): number {
  return (hours + minutes / 60 + seconds / 3600) * 15;
}

export function decToDeg(degrees: number, minutes: number, seconds: number): number {
  const sign = degrees < 0 ? -1 : 1;
  return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
}

export function degToRa(deg: number): { hours: number; minutes: number; seconds: number } {
  const totalHours = deg / 15;
  const hours = Math.floor(totalHours);
  const remainingMinutes = (totalHours - hours) * 60;
  const minutes = Math.floor(remainingMinutes);
  const seconds = (remainingMinutes - minutes) * 60;
  return { hours, minutes, seconds };
}

export function degToDec(deg: number): { degrees: number; minutes: number; seconds: number } {
  const sign = deg < 0 ? -1 : 1;
  const absDeg = Math.abs(deg);
  const degrees = Math.floor(absDeg) * sign;
  const remainingMinutes = (absDeg - Math.floor(absDeg)) * 60;
  const minutes = Math.floor(remainingMinutes);
  const seconds = (remainingMinutes - minutes) * 60;
  return { degrees, minutes, seconds };
}

export function equatorialToCartesian(raDeg: number, decDeg: number, radius: number = 1): { x: number; y: number; z: number } {
  const ra = degToRad(raDeg);
  const dec = degToRad(decDeg);
  
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.cos(dec) * Math.sin(ra);
  const z = radius * Math.sin(dec);
  
  return { x, y, z };
}

export function cartesianToEquatorial(x: number, y: number, z: number): { ra: number; dec: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  
  if (r === 0) {
    return { ra: 0, dec: 0 };
  }
  
  let ra = Math.atan2(y, x);
  ra = radToDeg(ra);
  if (ra < 0) ra += 360;
  
  const dec = radToDeg(Math.asin(z / r));
  
  return { ra, dec };
}

export function horizontalToEquatorial(altDeg: number, azDeg: number, latDeg: number, lstDeg: number): { ra: number; dec: number } {
  const alt = degToRad(altDeg);
  const az = degToRad(azDeg);
  const lat = degToRad(latDeg);
  const lst = degToRad(lstDeg);
  
  const sinDec = Math.sin(alt) * Math.sin(lat) + Math.cos(alt) * Math.cos(lat) * Math.cos(az);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  
  const cosDec = Math.cos(dec);
  let hourAngle: number;
  
  if (Math.abs(cosDec) < 1e-10) {
    hourAngle = 0;
  } else {
    const sinHA = (-Math.cos(alt) * Math.sin(az)) / cosDec;
    const cosHA = (Math.sin(alt) * Math.cos(lat) - Math.cos(alt) * Math.sin(lat) * Math.cos(az)) / cosDec;
    hourAngle = Math.atan2(sinHA, cosHA);
  }
  
  let ra = lst - radToDeg(hourAngle);
  ra = ((ra % 360) + 360) % 360;
  
  return { ra, dec: radToDeg(dec) };
}

export function equatorialToHorizontal(raDeg: number, decDeg: number, latDeg: number, lstDeg: number): { alt: number; az: number } {
  const ra = degToRad(raDeg);
  const dec = degToRad(decDeg);
  const lat = degToRad(latDeg);
  const lst = degToRad(lstDeg);
  
  const hourAngle = lst - ra;
  
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(hourAngle);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  
  const cosAlt = Math.cos(alt);
  let az: number;
  
  if (Math.abs(cosAlt) < 1e-10) {
    az = 0;
  } else {
    const sinAz = (-Math.cos(dec) * Math.sin(hourAngle)) / cosAlt;
    const cosAz = (Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(hourAngle)) / cosAlt;
    az = Math.atan2(sinAz, cosAz);
    if (az < 0) az += 2 * Math.PI;
  }
  
  return { alt: radToDeg(alt), az: radToDeg(az) };
}

export function applyPrecession(raDeg: number, decDeg: number, fromEpoch: string, toEpoch: string): { ra: number; dec: number } {
  const fromYear = parseFloat(fromEpoch.substring(1));
  const toYear = parseFloat(toEpoch.substring(1));
  
  const T = (toYear - fromYear) / 100;
  const T2 = T * T;
  const T3 = T2 * T;
  
  const ra = degToRad(raDeg);
  const dec = degToRad(decDeg);
  
  const m = 3.07496 + 0.00186 * T;
  const n = 1.33621 - 0.00057 * T;
  
  const dRa = m + n * Math.sin(ra) * Math.tan(dec);
  const dDec = n * Math.cos(ra);
  
  const newRa = raDeg + dRa * T;
  const newDec = decDeg + dDec * T;
  
  return { 
    ra: ((newRa % 360) + 360) % 360, 
    dec: Math.max(-90, Math.min(90, newDec)) 
  };
}

export function calculateObliquity(epoch: string): number {
  const year = parseFloat(epoch.substring(1));
  
  if (epoch.startsWith('J')) {
    const T = (year - 2000) / 100;
    return 23.4392911 - 0.0130042 * T - 1.638e-7 * T * T + 5.027e-7 * T * T * T;
  } else if (epoch.startsWith('B')) {
    const T = (year - 1900) / 100;
    return 23.452294 - 0.0130125 * T - 1.6388e-7 * T * T + 5.027e-7 * T * T * T;
  }
  
  return 23.4392911;
}

export function sunEclipticLongitude(dayOfYear: number): number {
  const n = 2 * Math.PI / 365.25;
  const L0 = degToRad(280.4665);
  const g = degToRad(357.5291);
  
  const anomaly = g + n * dayOfYear;
  
  let lambda = L0 + n * dayOfYear + degToRad(1.9146) * Math.sin(anomaly) 
    + degToRad(0.01999) * Math.sin(2 * anomaly) + degToRad(0.00029) * Math.sin(3 * anomaly);
  
  lambda = ((lambda % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  return radToDeg(lambda);
}

export function eclipticToEquatorial(lambdaDeg: number, betaDeg: number, obliquityDeg: number): { ra: number; dec: number } {
  const lambda = degToRad(lambdaDeg);
  const beta = degToRad(betaDeg);
  const epsilon = degToRad(obliquityDeg);
  
  const sinDec = Math.sin(beta) * Math.cos(epsilon) + Math.cos(beta) * Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  
  const cosDec = Math.cos(dec);
  let ra: number;
  
  if (Math.abs(cosDec) < 1e-10) {
    ra = 0;
  } else {
    const sinRa = (Math.cos(beta) * Math.cos(lambda)) / cosDec;
    const cosRa = (Math.sin(beta) * Math.sin(epsilon) - Math.cos(beta) * Math.cos(epsilon) * Math.sin(lambda)) / cosDec;
    ra = Math.atan2(sinRa, cosRa);
    if (ra < 0) ra += 2 * Math.PI;
  }
  
  return { ra: radToDeg(ra), dec: radToDeg(dec) };
}

export function getZodiacSign(lambdaDeg: number): string {
  const signs = [
    { name: 'Aries', start: 0 },
    { name: 'Taurus', start: 30 },
    { name: 'Gemini', start: 60 },
    { name: 'Cancer', start: 90 },
    { name: 'Leo', start: 120 },
    { name: 'Virgo', start: 150 },
    { name: 'Libra', start: 180 },
    { name: 'Scorpius', start: 210 },
    { name: 'Sagittarius', start: 240 },
    { name: 'Capricornus', start: 270 },
    { name: 'Aquarius', start: 300 },
    { name: 'Pisces', start: 330 },
  ];
  
  const normalized = ((lambdaDeg % 360) + 360) % 360;
  
  for (let i = signs.length - 1; i >= 0; i--) {
    if (normalized >= signs[i].start) {
      return signs[i].name;
    }
  }
  
  return 'Aries';
}

export function calculateLST(year: number, month: number, day: number, hours: number = 0): number {
  const J0 = Math.floor(365.25 * (year - 2000));
  const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let D = monthDays[month - 1] + day - 1;
  
  if (month > 2 && isLeapYear(year)) {
    D += 1;
  }
  
  const JD = 2451545.0 + J0 + D + hours / 24;
  const T = (JD - 2451545.0) / 36525;
  
  let GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) 
    + 0.000387933 * T * T - T * T * T / 38710000;
  
  GMST = ((GMST % 360) + 360) % 360;
  
  return GMST;
}

function isLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 !== 0) return true;
  if (year % 400 !== 0) return false;
  return true;
}

export function julianDay(year: number, month: number, day: number, hours: number = 0): number {
  let Y = year;
  let M = month;
  
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  
  let JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5;
  
  JD += hours / 24;
  
  return JD;
}

export function convertCalendar(date: Date): { year: number; month: number; day: number; isGregorian: boolean } {
  const JD = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  const gregorianSwitchJD = 2299161.0;
  
  if (JD >= gregorianSwitchJD) {
    return { 
      year: date.getFullYear(), 
      month: date.getMonth() + 1, 
      day: date.getDate(), 
      isGregorian: true 
    };
  } else {
    const Y = date.getFullYear();
    const M = date.getMonth() + 1;
    const D = date.getDate();
    
    let adjustedDay = D;
    
    if (JD < gregorianSwitchJD && Y >= 1582 && M === 10 && D > 4 && D < 15) {
      adjustedDay = D + 10;
    }
    
    return { year: Y, month: M, day: adjustedDay, isGregorian: false };
  }
}

export function calculateAltitude(decDeg: number, latDeg: number, hourAngleDeg: number): number {
  const dec = degToRad(decDeg);
  const lat = degToRad(latDeg);
  const ha = degToRad(hourAngleDeg);
  
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  
  return radToDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
}

export function calculateAzimuth(decDeg: number, latDeg: number, hourAngleDeg: number): number {
  const dec = degToRad(decDeg);
  const lat = degToRad(latDeg);
  const ha = degToRad(hourAngleDeg);
  
  const alt = degToRad(calculateAltitude(decDeg, latDeg, hourAngleDeg));
  const cosAlt = Math.cos(alt);
  
  if (Math.abs(cosAlt) < 1e-10) {
    return 0;
  }
  
  const sinAz = (-Math.cos(dec) * Math.sin(ha)) / cosAlt;
  const cosAz = (Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(ha)) / cosAlt;
  
  let az = Math.atan2(sinAz, cosAz);
  if (az < 0) az += 2 * Math.PI;
  
  return radToDeg(az);
}

export function sphericalDistance(ra1: number, dec1: number, ra2: number, dec2: number): number {
  const r1 = degToRad(ra1);
  const d1 = degToRad(dec1);
  const r2 = degToRad(ra2);
  const d2 = degToRad(dec2);
  
  const deltaRa = Math.abs(r1 - r2);
  
  const sinD = Math.sqrt(
    Math.pow(Math.cos(d2) * Math.sin(deltaRa), 2) +
    Math.pow(Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(deltaRa), 2)
  );
  
  const cosD = Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(deltaRa);
  
  const distance = Math.atan2(sinD, cosD);
  
  return radToDeg(distance);
}

export function nutationCorrection(epoch: string): { deltaPsi: number; deltaEpsilon: number } {
  const year = parseFloat(epoch.substring(1));
  const T = (year - 2000) / 100;
  
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000;
  const L = 280.4665 + 36000.7698 * T;
  const LPrime = 218.3165 + 481267.8813 * T;
  
  const deltaPsi = -17.2 * Math.sin(degToRad(omega)) 
    - 1.32 * Math.sin(2 * degToRad(L)) 
    - 0.23 * Math.sin(2 * degToRad(LPrime)) 
    + 0.21 * Math.sin(2 * degToRad(omega));
  
  const deltaEpsilon = 9.2 * Math.cos(degToRad(omega)) 
    + 0.57 * Math.cos(2 * degToRad(L)) 
    + 0.1 * Math.cos(2 * degToRad(LPrime)) 
    - 0.09 * Math.cos(2 * degToRad(omega));
  
  return { deltaPsi: deltaPsi / 3600, deltaEpsilon: deltaEpsilon / 3600 };
}