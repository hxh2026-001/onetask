import { NextResponse } from 'next/server';
import { 
  raToDeg, 
  decToDeg, 
  equatorialToHorizontal, 
  applyPrecession,
  calculateObliquity,
  sunEclipticLongitude,
  eclipticToEquatorial,
  getZodiacSign,
  calculateLST,
  convertCalendar,
  sphericalDistance,
  nutationCorrection
} from '@/lib/astronomy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { operation, params } = body;
    
    switch (operation) {
      case 'equatorialToHorizontal': {
        const { raHours, raMinutes, raSeconds, decDegrees, decMinutes, decSeconds, latitude, lst } = params;
        const ra = raToDeg(raHours, raMinutes, raSeconds);
        const dec = decToDeg(decDegrees, decMinutes, decSeconds);
        const result = equatorialToHorizontal(ra, dec, latitude, lst);
        return NextResponse.json(result);
      }
      
      case 'applyPrecession': {
        const { raHours, raMinutes, raSeconds, decDegrees, decMinutes, decSeconds, fromEpoch, toEpoch } = params;
        const ra = raToDeg(raHours, raMinutes, raSeconds);
        const dec = decToDeg(decDegrees, decMinutes, decSeconds);
        const result = applyPrecession(ra, dec, fromEpoch, toEpoch);
        return NextResponse.json(result);
      }
      
      case 'calculateObliquity': {
        const { epoch } = params;
        const result = calculateObliquity(epoch);
        return NextResponse.json({ obliquity: result });
      }
      
      case 'sunPosition': {
        const { dayOfYear, epoch } = params;
        const eclipticLongitude = sunEclipticLongitude(dayOfYear);
        const obliquity = calculateObliquity(epoch);
        const equatorial = eclipticToEquatorial(eclipticLongitude, 0, obliquity);
        const zodiac = getZodiacSign(eclipticLongitude);
        return NextResponse.json({ eclipticLongitude, obliquity, ...equatorial, zodiac });
      }
      
      case 'calculateLST': {
        const { year, month, day, hours } = params;
        const lst = calculateLST(year, month, day, hours);
        return NextResponse.json({ lst });
      }
      
      case 'convertCalendar': {
        const { date } = params;
        const result = convertCalendar(new Date(date));
        return NextResponse.json(result);
      }
      
      case 'sphericalDistance': {
        const { ra1, dec1, ra2, dec2 } = params;
        const distance = sphericalDistance(ra1, dec1, ra2, dec2);
        return NextResponse.json({ distance });
      }
      
      case 'nutationCorrection': {
        const { epoch } = params;
        const result = nutationCorrection(epoch);
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}