export interface Star {
  id: number;
  name: string;
  ra_hours: number;
  ra_minutes: number;
  ra_seconds: number;
  dec_degrees: number;
  dec_minutes: number;
  dec_seconds: number;
  magnitude: number;
  spectral_type: string;
  constellation: string;
}

export interface ConstellationLine {
  constellation: string;
  star1_id: number;
  star2_id: number;
}

export interface EpochData {
  epoch: string;
  obliquity: number;
  precession_rate: number;
}

export const stars: Star[] = [
  { id: 1, name: 'Polaris', ra_hours: 2, ra_minutes: 31, ra_seconds: 48.7, dec_degrees: 89, dec_minutes: 15, dec_seconds: 50.8, magnitude: 2.0, spectral_type: 'F7', constellation: 'Ursa Minor' },
  { id: 2, name: 'Vega', ra_hours: 18, ra_minutes: 36, ra_seconds: 56.3, dec_degrees: 38, dec_minutes: 47, dec_seconds: 1.2, magnitude: 0.03, spectral_type: 'A0', constellation: 'Lyra' },
  { id: 3, name: 'Arcturus', ra_hours: 14, ra_minutes: 15, ra_seconds: 39.7, dec_degrees: 19, dec_minutes: 10, dec_seconds: 56.7, magnitude: -0.04, spectral_type: 'K1', constellation: 'Boötes' },
  { id: 4, name: 'Aldebaran', ra_hours: 4, ra_minutes: 35, ra_seconds: 55.2, dec_degrees: 16, dec_minutes: 30, dec_seconds: 33.5, magnitude: 0.85, spectral_type: 'K5', constellation: 'Taurus' },
  { id: 5, name: 'Antares', ra_hours: 16, ra_minutes: 29, ra_seconds: 24.4, dec_degrees: -26, dec_minutes: 25, dec_seconds: 55.2, magnitude: 1.09, spectral_type: 'M1', constellation: 'Scorpius' },
  { id: 6, name: 'Betelgeuse', ra_hours: 5, ra_minutes: 55, ra_seconds: 10.3, dec_degrees: 7, dec_minutes: 24, dec_seconds: 25.3, magnitude: 0.42, spectral_type: 'M2', constellation: 'Orion' },
  { id: 7, name: 'Rigel', ra_hours: 5, ra_minutes: 14, ra_seconds: 32.3, dec_degrees: -8, dec_minutes: 12, dec_seconds: 5.9, magnitude: 0.12, spectral_type: 'B8', constellation: 'Orion' },
  { id: 8, name: 'Sirius', ra_hours: 6, ra_minutes: 45, ra_seconds: 8.9, dec_degrees: -16, dec_minutes: 42, dec_seconds: 58.0, magnitude: -1.46, spectral_type: 'A1', constellation: 'Canis Major' },
  { id: 9, name: 'Procyon', ra_hours: 7, ra_minutes: 39, ra_seconds: 18.1, dec_degrees: 5, dec_minutes: 13, dec_seconds: 29.9, magnitude: 0.34, spectral_type: 'F5', constellation: 'Canis Minor' },
  { id: 10, name: 'Altair', ra_hours: 19, ra_minutes: 50, ra_seconds: 47.0, dec_degrees: 8, dec_minutes: 52, dec_seconds: 5.9, magnitude: 0.77, spectral_type: 'A7', constellation: 'Aquila' },
  { id: 11, name: 'Deneb', ra_hours: 20, ra_minutes: 38, ra_seconds: 45.4, dec_degrees: 45, dec_minutes: 16, dec_seconds: 49.2, magnitude: 1.25, spectral_type: 'A2', constellation: 'Cygnus' },
  { id: 12, name: 'Spica', ra_hours: 13, ra_minutes: 25, ra_seconds: 11.6, dec_degrees: -11, dec_minutes: 9, dec_seconds: 40.8, magnitude: 1.04, spectral_type: 'B1', constellation: 'Virgo' },
  { id: 13, name: 'Regulus', ra_hours: 10, ra_minutes: 8, ra_seconds: 22.3, dec_degrees: 11, dec_minutes: 58, dec_seconds: 1.9, magnitude: 1.35, spectral_type: 'B7', constellation: 'Leo' },
  { id: 14, name: 'Pollux', ra_hours: 7, ra_minutes: 45, ra_seconds: 18.9, dec_degrees: 28, dec_minutes: 1, dec_seconds: 34.3, magnitude: 1.16, spectral_type: 'K0', constellation: 'Gemini' },
  { id: 15, name: 'Castor', ra_hours: 7, ra_minutes: 34, ra_seconds: 36.9, dec_degrees: 31, dec_minutes: 53, dec_seconds: 19.0, magnitude: 1.58, spectral_type: 'A1', constellation: 'Gemini' },
  { id: 16, name: 'Capella', ra_hours: 5, ra_minutes: 16, ra_seconds: 41.4, dec_degrees: 45, dec_minutes: 59, dec_seconds: 52.8, magnitude: 0.08, spectral_type: 'G8', constellation: 'Auriga' },
  { id: 17, name: 'Aldebaran', ra_hours: 4, ra_minutes: 35, ra_seconds: 55.2, dec_degrees: 16, dec_minutes: 30, dec_seconds: 33.5, magnitude: 0.85, spectral_type: 'K5', constellation: 'Taurus' },
  { id: 18, name: 'Bellatrix', ra_hours: 5, ra_minutes: 25, ra_seconds: 7.9, dec_degrees: 6, dec_minutes: 20, dec_seconds: 59.0, magnitude: 1.64, spectral_type: 'B2', constellation: 'Orion' },
  { id: 19, name: 'Saiph', ra_hours: 5, ra_minutes: 47, ra_seconds: 45.3, dec_degrees: -9, dec_minutes: 40, dec_seconds: 11.0, magnitude: 2.06, spectral_type: 'B0', constellation: 'Orion' },
  { id: 20, name: 'Alnilam', ra_hours: 5, ra_minutes: 36, ra_seconds: 12.8, dec_degrees: -1, dec_minutes: 12, dec_seconds: 6.3, magnitude: 1.70, spectral_type: 'B0', constellation: 'Orion' },
  { id: 21, name: 'Alnitak', ra_hours: 5, ra_minutes: 32, ra_seconds: 0.4, dec_degrees: -1, dec_minutes: 56, dec_seconds: 33.0, magnitude: 1.74, spectral_type: 'B0', constellation: 'Orion' },
  { id: 22, name: 'Mintaka', ra_hours: 5, ra_minutes: 32, ra_seconds: 0.4, dec_degrees: 0, dec_minutes: 17, dec_seconds: 56.0, magnitude: 2.23, spectral_type: 'O9', constellation: 'Orion' },
  { id: 23, name: 'Alpheratz', ra_hours: 0, ra_minutes: 8, ra_seconds: 23.0, dec_degrees: 29, dec_minutes: 6, dec_seconds: 46.0, magnitude: 2.07, spectral_type: 'B8', constellation: 'Andromeda' },
  { id: 24, name: 'Mirach', ra_hours: 1, ra_minutes: 9, ra_seconds: 43.8, dec_degrees: 35, dec_minutes: 37, dec_seconds: 13.0, magnitude: 2.05, spectral_type: 'M0', constellation: 'Andromeda' },
  { id: 25, name: 'Algenib', ra_hours: 2, ra_minutes: 3, ra_seconds: 53.9, dec_degrees: 33, dec_minutes: 58, dec_seconds: 25.0, magnitude: 2.87, spectral_type: 'B9', constellation: 'Andromeda' },
  { id: 26, name: 'Mirfak', ra_hours: 3, ra_minutes: 24, ra_seconds: 19.4, dec_degrees: 45, dec_minutes: 9, dec_seconds: 6.0, magnitude: 1.79, spectral_type: 'F5', constellation: 'Perseus' },
  { id: 27, name: 'Algol', ra_hours: 3, ra_minutes: 8, ra_seconds: 10.2, dec_degrees: 40, dec_minutes: 57, dec_seconds: 20.0, magnitude: 2.12, spectral_type: 'B8', constellation: 'Perseus' },
  { id: 28, name: 'Schedar', ra_hours: 0, ra_minutes: 40, ra_seconds: 1.2, dec_degrees: 56, dec_minutes: 32, dec_seconds: 15.0, magnitude: 2.24, spectral_type: 'K0', constellation: 'Cassiopeia' },
  { id: 29, name: 'Caph', ra_hours: 0, ra_minutes: 18, ra_seconds: 24.0, dec_degrees: 59, dec_minutes: 8, dec_seconds: 45.0, magnitude: 2.28, spectral_type: 'F2', constellation: 'Cassiopeia' },
  { id: 30, name: 'Deneb', ra_hours: 20, ra_minutes: 38, ra_seconds: 45.4, dec_degrees: 45, dec_minutes: 16, dec_seconds: 49.2, magnitude: 1.25, spectral_type: 'A2', constellation: 'Cygnus' },
  { id: 31, name: 'Albireo', ra_hours: 19, ra_minutes: 30, ra_seconds: 43.0, dec_degrees: 27, dec_minutes: 57, dec_seconds: 34.0, magnitude: 3.05, spectral_type: 'K0', constellation: 'Cygnus' },
  { id: 32, name: 'Sadr', ra_hours: 19, ra_minutes: 50, ra_seconds: 3.0, dec_degrees: 40, dec_minutes: 15, dec_seconds: 20.0, magnitude: 2.23, spectral_type: 'F8', constellation: 'Cygnus' },
  { id: 33, name: 'Vega', ra_hours: 18, ra_minutes: 36, ra_seconds: 56.3, dec_degrees: 38, dec_minutes: 47, dec_seconds: 1.2, magnitude: 0.03, spectral_type: 'A0', constellation: 'Lyra' },
  { id: 34, name: 'Sheliak', ra_hours: 18, ra_minutes: 14, ra_seconds: 6.0, dec_degrees: 36, dec_minutes: 50, dec_seconds: 23.0, magnitude: 3.35, spectral_type: 'B6', constellation: 'Lyra' },
  { id: 35, name: 'Alathfar', ra_hours: 18, ra_minutes: 25, ra_seconds: 13.0, dec_degrees: 39, dec_minutes: 33, dec_seconds: 23.0, magnitude: 3.24, spectral_type: 'A8', constellation: 'Lyra' },
  { id: 36, name: 'Altair', ra_hours: 19, ra_minutes: 50, ra_seconds: 47.0, dec_degrees: 8, dec_minutes: 52, dec_seconds: 5.9, magnitude: 0.77, spectral_type: 'A7', constellation: 'Aquila' },
  { id: 37, name: 'Tarazed', ra_hours: 19, ra_minutes: 6, ra_seconds: 27.0, dec_degrees: 16, dec_minutes: 30, dec_seconds: 26.0, magnitude: 2.72, spectral_type: 'K3', constellation: 'Aquila' },
  { id: 38, name: 'Alshain', ra_hours: 20, ra_minutes: 18, ra_seconds: 34.0, dec_degrees: 0, dec_minutes: 46, dec_seconds: 30.0, magnitude: 3.77, spectral_type: 'K2', constellation: 'Aquila' },
  { id: 39, name: 'Antares', ra_hours: 16, ra_minutes: 29, ra_seconds: 24.4, dec_degrees: -26, dec_minutes: 25, dec_seconds: 55.2, magnitude: 1.09, spectral_type: 'M1', constellation: 'Scorpius' },
  { id: 40, name: 'Acrab', ra_hours: 16, ra_minutes: 5, ra_seconds: 26.0, dec_degrees: -19, dec_minutes: 48, dec_seconds: 47.0, magnitude: 2.10, spectral_type: 'B1', constellation: 'Scorpius' },
  { id: 41, name: 'Shaula', ra_hours: 17, ra_minutes: 33, ra_seconds: 36.0, dec_degrees: -37, dec_minutes: 6, dec_seconds: 13.0, magnitude: 1.62, spectral_type: 'B2', constellation: 'Scorpius' },
  { id: 42, name: 'Arcturus', ra_hours: 14, ra_minutes: 15, ra_seconds: 39.7, dec_degrees: 19, dec_minutes: 10, dec_seconds: 56.7, magnitude: -0.04, spectral_type: 'K1', constellation: 'Boötes' },
  { id: 43, name: 'Alkalurops', ra_hours: 13, ra_minutes: 11, ra_seconds: 50.0, dec_degrees: 19, dec_minutes: 8, dec_seconds: 0.0, magnitude: 3.69, spectral_type: 'A3', constellation: 'Boötes' },
  { id: 44, name: 'Spica', ra_hours: 13, ra_minutes: 25, ra_seconds: 11.6, dec_degrees: -11, dec_minutes: 9, dec_seconds: 40.8, magnitude: 1.04, spectral_type: 'B1', constellation: 'Virgo' },
  { id: 45, name: 'Zavijava', ra_hours: 12, ra_minutes: 41, ra_seconds: 3.0, dec_degrees: -1, dec_minutes: 52, dec_seconds: 58.0, magnitude: 3.60, spectral_type: 'F9', constellation: 'Virgo' },
  { id: 46, name: 'Vindemiatrix', ra_hours: 13, ra_minutes: 54, ra_seconds: 31.0, dec_degrees: -10, dec_minutes: 34, dec_seconds: 15.0, magnitude: 2.85, spectral_type: 'G5', constellation: 'Virgo' },
  { id: 47, name: 'Regulus', ra_hours: 10, ra_minutes: 8, ra_seconds: 22.3, dec_degrees: 11, dec_minutes: 58, dec_seconds: 1.9, magnitude: 1.35, spectral_type: 'B7', constellation: 'Leo' },
  { id: 48, name: 'Algieba', ra_hours: 10, ra_minutes: 20, ra_seconds: 9.0, dec_degrees: 19, dec_minutes: 58, dec_seconds: 49.0, magnitude: 2.01, spectral_type: 'K0', constellation: 'Leo' },
  { id: 49, name: 'Denebola', ra_hours: 11, ra_minutes: 49, ra_seconds: 3.0, dec_degrees: 14, dec_minutes: 34, dec_seconds: 2.0, magnitude: 2.14, spectral_type: 'A3', constellation: 'Leo' },
  { id: 50, name: 'Pollux', ra_hours: 7, ra_minutes: 45, ra_seconds: 18.9, dec_degrees: 28, dec_minutes: 1, dec_seconds: 34.3, magnitude: 1.16, spectral_type: 'K0', constellation: 'Gemini' },
  { id: 51, name: 'Castor', ra_hours: 7, ra_minutes: 34, ra_seconds: 36.9, dec_degrees: 31, dec_minutes: 53, dec_seconds: 19.0, magnitude: 1.58, spectral_type: 'A1', constellation: 'Gemini' },
  { id: 52, name: 'Alhena', ra_hours: 7, ra_minutes: 23, ra_seconds: 21.0, dec_degrees: 16, dec_minutes: 23, dec_seconds: 26.0, magnitude: 1.93, spectral_type: 'A0', constellation: 'Gemini' },
  { id: 53, name: 'Capella', ra_hours: 5, ra_minutes: 16, ra_seconds: 41.4, dec_degrees: 45, dec_minutes: 59, dec_seconds: 52.8, magnitude: 0.08, spectral_type: 'G8', constellation: 'Auriga' },
  { id: 54, name: 'Menkalinan', ra_hours: 4, ra_minutes: 58, ra_seconds: 33.0, dec_degrees: 44, dec_minutes: 56, dec_seconds: 56.0, magnitude: 1.90, spectral_type: 'A2', constellation: 'Auriga' },
  { id: 55, name: 'Almaaz', ra_hours: 5, ra_minutes: 44, ra_seconds: 41.0, dec_degrees: 39, dec_minutes: 7, dec_seconds: 13.0, magnitude: 2.47, spectral_type: 'A3', constellation: 'Auriga' },
  { id: 56, name: 'Aldebaran', ra_hours: 4, ra_minutes: 35, ra_seconds: 55.2, dec_degrees: 16, dec_minutes: 30, dec_seconds: 33.5, magnitude: 0.85, spectral_type: 'K5', constellation: 'Taurus' },
  { id: 57, name: 'Elnath', ra_hours: 5, ra_minutes: 36, ra_seconds: 13.0, dec_degrees: 28, dec_minutes: 36, dec_seconds: 56.0, magnitude: 1.65, spectral_type: 'B7', constellation: 'Taurus' },
  { id: 58, name: 'Hyadum I', ra_hours: 4, ra_minutes: 28, ra_seconds: 7.0, dec_degrees: 15, dec_minutes: 44, dec_seconds: 48.0, magnitude: 2.87, spectral_type: 'A7', constellation: 'Taurus' },
  { id: 59, name: 'Sirius', ra_hours: 6, ra_minutes: 45, ra_seconds: 8.9, dec_degrees: -16, dec_minutes: 42, dec_seconds: 58.0, magnitude: -1.46, spectral_type: 'A1', constellation: 'Canis Major' },
  { id: 60, name: 'Adhara', ra_hours: 6, ra_minutes: 58, ra_seconds: 37.0, dec_degrees: -28, dec_minutes: 58, dec_seconds: 18.0, magnitude: 1.50, spectral_type: 'B2', constellation: 'Canis Major' },
  { id: 61, name: 'Wezen', ra_hours: 7, ra_minutes: 8, ra_seconds: 23.0, dec_degrees: -26, dec_minutes: 24, dec_seconds: 42.0, magnitude: 1.86, spectral_type: 'F8', constellation: 'Canis Major' },
  { id: 62, name: 'Procyon', ra_hours: 7, ra_minutes: 39, ra_seconds: 18.1, dec_degrees: 5, dec_minutes: 13, dec_seconds: 29.9, magnitude: 0.34, spectral_type: 'F5', constellation: 'Canis Minor' },
  { id: 63, name: 'Gomeisa', ra_hours: 7, ra_minutes: 18, ra_seconds: 29.0, dec_degrees: 8, dec_minutes: 18, dec_seconds: 18.0, magnitude: 2.89, spectral_type: 'B8', constellation: 'Canis Minor' },
  { id: 64, name: 'Polaris', ra_hours: 2, ra_minutes: 31, ra_seconds: 48.7, dec_degrees: 89, dec_minutes: 15, dec_seconds: 50.8, magnitude: 2.0, spectral_type: 'F7', constellation: 'Ursa Minor' },
  { id: 65, name: 'Kochab', ra_hours: 1, ra_minutes: 53, ra_seconds: 41.0, dec_degrees: 74, dec_minutes: 9, dec_seconds: 13.0, magnitude: 2.08, spectral_type: 'K4', constellation: 'Ursa Minor' },
  { id: 66, name: 'Pherkad', ra_hours: 1, ra_minutes: 39, ra_seconds: 8.0, dec_degrees: 71, dec_minutes: 50, dec_seconds: 9.0, magnitude: 3.05, spectral_type: 'A3', constellation: 'Ursa Minor' },
  { id: 67, name: 'Dubhe', ra_hours: 11, ra_minutes: 3, ra_seconds: 43.0, dec_degrees: 61, dec_minutes: 45, dec_seconds: 3.0, magnitude: 1.81, spectral_type: 'A0', constellation: 'Ursa Major' },
  { id: 68, name: 'Merak', ra_hours: 11, ra_minutes: 1, ra_seconds: 50.0, dec_degrees: 56, dec_minutes: 23, dec_seconds: 15.0, magnitude: 2.37, spectral_type: 'A1', constellation: 'Ursa Major' },
  { id: 69, name: 'Phecda', ra_hours: 11, ra_minutes: 53, ra_seconds: 49.0, dec_degrees: 53, dec_minutes: 41, dec_seconds: 41.0, magnitude: 2.44, spectral_type: 'A0', constellation: 'Ursa Major' },
  { id: 70, name: 'Megrez', ra_hours: 12, ra_minutes: 15, ra_seconds: 25.0, dec_degrees: 55, dec_minutes: 55, dec_seconds: 16.0, magnitude: 3.31, spectral_type: 'A3', constellation: 'Ursa Major' },
  { id: 71, name: 'Alioth', ra_hours: 12, ra_minutes: 54, ra_seconds: 1.0, dec_degrees: 55, dec_minutes: 57, dec_seconds: 35.0, magnitude: 1.77, spectral_type: 'A0', constellation: 'Ursa Major' },
  { id: 72, name: 'Mizar', ra_hours: 13, ra_minutes: 23, ra_seconds: 55.0, dec_degrees: 54, dec_minutes: 55, dec_seconds: 31.0, magnitude: 2.23, spectral_type: 'A2', constellation: 'Ursa Major' },
  { id: 73, name: 'Alkaid', ra_hours: 13, ra_minutes: 47, ra_seconds: 32.0, dec_degrees: 49, dec_minutes: 18, dec_seconds: 48.0, magnitude: 1.85, spectral_type: 'B3', constellation: 'Ursa Major' },
  { id: 74, name: 'Alpha Centauri', ra_hours: 14, ra_minutes: 39, ra_seconds: 36.5, dec_degrees: -60, dec_minutes: 50, dec_seconds: 2.3, magnitude: -0.27, spectral_type: 'G2', constellation: 'Centaurus' },
  { id: 75, name: 'Beta Centauri', ra_hours: 14, ra_minutes: 3, ra_seconds: 49.4, dec_degrees: -60, dec_minutes: 22, dec_seconds: 30.0, magnitude: 0.61, spectral_type: 'B1', constellation: 'Centaurus' },
  { id: 76, name: 'Rigil Kentaurus', ra_hours: 14, ra_minutes: 39, ra_seconds: 36.5, dec_degrees: -60, dec_minutes: 50, dec_seconds: 2.3, magnitude: -0.01, spectral_type: 'G2', constellation: 'Centaurus' },
  { id: 77, name: 'Canopus', ra_hours: 6, ra_minutes: 23, ra_seconds: 57.1, dec_degrees: -52, dec_minutes: 41, dec_seconds: 44.0, magnitude: -0.72, spectral_type: 'F0', constellation: 'Carina' },
  { id: 78, name: 'Achernar', ra_hours: 1, ra_minutes: 37, ra_seconds: 42.8, dec_degrees: -57, dec_minutes: 14, dec_seconds: 12.0, magnitude: 0.45, spectral_type: 'B3', constellation: 'Eridanus' },
  { id: 79, name: 'Fomalhaut', ra_hours: 22, ra_minutes: 57, ra_seconds: 39.1, dec_degrees: -29, dec_minutes: 37, dec_seconds: 20.0, magnitude: 1.16, spectral_type: 'A3', constellation: 'Piscis Austrinus' },
  { id: 80, name: 'Deneb Kaitos', ra_hours: 22, ra_minutes: 4, ra_seconds: 28.0, dec_degrees: -16, dec_minutes: 30, dec_seconds: 32.0, magnitude: 2.45, spectral_type: 'K0', constellation: 'Cetus' },
  { id: 81, name: 'Mira', ra_hours: 2, ra_minutes: 19, ra_seconds: 20.0, dec_degrees: -8, dec_minutes: 22, dec_seconds: 58.0, magnitude: 3.0, spectral_type: 'M7', constellation: 'Cetus' },
  { id: 82, name: 'Alpha Hydri', ra_hours: 0, ra_minutes: 13, ra_seconds: 11.0, dec_degrees: -77, dec_minutes: 24, dec_seconds: 12.0, magnitude: 2.80, spectral_type: 'G2', constellation: 'Hydrus' },
  { id: 83, name: 'Alpha Pavonis', ra_hours: 20, ra_minutes: 8, ra_seconds: 43.0, dec_degrees: -56, dec_minutes: 44, dec_seconds: 6.0, magnitude: 1.94, spectral_type: 'F0', constellation: 'Pavo' },
  { id: 84, name: 'Alpha Arae', ra_hours: 17, ra_minutes: 24, ra_seconds: 23.0, dec_degrees: -49, dec_minutes: 52, dec_seconds: 44.0, magnitude: 2.95, spectral_type: 'B2', constellation: 'Ara' },
  { id: 85, name: 'Alpha Tucanae', ra_hours: 23, ra_minutes: 41, ra_seconds: 54.0, dec_degrees: -69, dec_minutes: 6, dec_seconds: 6.0, magnitude: 2.86, spectral_type: 'A0', constellation: 'Tucana' },
  { id: 86, name: 'Beta Tucanae', ra_hours: 0, ra_minutes: 5, ra_seconds: 16.0, dec_degrees: -64, dec_minutes: 50, dec_seconds: 6.0, magnitude: 3.85, spectral_type: 'A3', constellation: 'Tucana' },
  { id: 87, name: 'Alpha Indi', ra_hours: 21, ra_minutes: 5, ra_seconds: 3.0, dec_degrees: -57, dec_minutes: 25, dec_seconds: 6.0, magnitude: 3.11, spectral_type: 'K5', constellation: 'Indus' },
  { id: 88, name: 'Alpha Octantis', ra_hours: 20, ra_minutes: 25, ra_seconds: 38.0, dec_degrees: -87, dec_minutes: 28, dec_seconds: 6.0, magnitude: 5.41, spectral_type: 'F0', constellation: 'Octans' },
  { id: 89, name: 'Sigma Octantis', ra_hours: 20, ra_minutes: 38, ra_seconds: 42.0, dec_degrees: -88, dec_minutes: 57, dec_seconds: 6.0, magnitude: 5.49, spectral_type: 'F2', constellation: 'Octans' },
  { id: 90, name: 'Alpha Caeli', ra_hours: 4, ra_minutes: 41, ra_seconds: 41.0, dec_degrees: -32, dec_minutes: 41, dec_seconds: 24.0, magnitude: 4.46, spectral_type: 'A5', constellation: 'Caelum' },
  { id: 91, name: 'Alpha Fornacis', ra_hours: 2, ra_minutes: 30, ra_seconds: 37.0, dec_degrees: -34, dec_minutes: 9, dec_seconds: 54.0, magnitude: 3.85, spectral_type: 'F0', constellation: 'Fornax' },
  { id: 92, name: 'Alpha Sculptoris', ra_hours: 0, ra_minutes: 17, ra_seconds: 9.0, dec_degrees: -33, dec_minutes: 58, dec_seconds: 54.0, magnitude: 4.31, spectral_type: 'A5', constellation: 'Sculptor' },
  { id: 93, name: 'Alpha Horologii', ra_hours: 2, ra_minutes: 51, ra_seconds: 15.0, dec_degrees: -46, dec_minutes: 19, dec_seconds: 48.0, magnitude: 3.85, spectral_type: 'F5', constellation: 'Horologium' },
  { id: 94, name: 'Alpha Reticuli', ra_hours: 3, ra_minutes: 34, ra_seconds: 47.0, dec_degrees: -62, dec_minutes: 31, dec_seconds: 18.0, magnitude: 3.35, spectral_type: 'K3', constellation: 'Reticulum' },
  { id: 95, name: 'Alpha Pictoris', ra_hours: 5, ra_minutes: 37, ra_seconds: 36.0, dec_degrees: -51, dec_minutes: 31, dec_seconds: 18.0, magnitude: 3.27, spectral_type: 'B7', constellation: 'Pictor' },
  { id: 96, name: 'Alpha Carinae', ra_hours: 6, ra_minutes: 23, ra_seconds: 57.1, dec_degrees: -52, dec_minutes: 41, dec_seconds: 44.0, magnitude: -0.72, spectral_type: 'F0', constellation: 'Carina' },
  { id: 97, name: 'Beta Carinae', ra_hours: 6, ra_minutes: 15, ra_seconds: 8.0, dec_degrees: -59, dec_minutes: 41, dec_seconds: 44.0, magnitude: 2.21, spectral_type: 'B1', constellation: 'Carina' },
  { id: 98, name: 'Eta Carinae', ra_hours: 10, ra_minutes: 45, ra_seconds: 3.0, dec_degrees: -59, dec_minutes: 41, dec_seconds: 44.0, magnitude: 4.3, spectral_type: 'O9', constellation: 'Carina' },
  { id: 99, name: 'Alpha Muscae', ra_hours: 12, ra_minutes: 32, ra_seconds: 47.0, dec_degrees: -69, dec_minutes: 6, dec_seconds: 6.0, magnitude: 2.69, spectral_type: 'B2', constellation: 'Musca' },
  { id: 100, name: 'Alpha Apodis', ra_hours: 13, ra_minutes: 43, ra_seconds: 31.0, dec_degrees: -73, dec_minutes: 10, dec_seconds: 6.0, magnitude: 3.83, spectral_type: 'B5', constellation: 'Apus' },
];

export const constellationLines: ConstellationLine[] = [
  { constellation: 'Orion', star1_id: 6, star2_id: 7 },
  { constellation: 'Orion', star1_id: 6, star2_id: 18 },
  { constellation: 'Orion', star1_id: 18, star2_id: 22 },
  { constellation: 'Orion', star1_id: 22, star2_id: 20 },
  { constellation: 'Orion', star1_id: 20, star2_id: 21 },
  { constellation: 'Orion', star1_id: 21, star2_id: 7 },
  { constellation: 'Orion', star1_id: 20, star2_id: 19 },
  { constellation: 'Orion', star1_id: 19, star2_id: 7 },
  { constellation: 'Ursa Major', star1_id: 67, star2_id: 68 },
  { constellation: 'Ursa Major', star1_id: 68, star2_id: 69 },
  { constellation: 'Ursa Major', star1_id: 69, star2_id: 70 },
  { constellation: 'Ursa Major', star1_id: 70, star2_id: 71 },
  { constellation: 'Ursa Major', star1_id: 71, star2_id: 72 },
  { constellation: 'Ursa Major', star1_id: 72, star2_id: 73 },
  { constellation: 'Ursa Major', star1_id: 69, star2_id: 72 },
  { constellation: 'Ursa Minor', star1_id: 64, star2_id: 65 },
  { constellation: 'Ursa Minor', star1_id: 65, star2_id: 66 },
  { constellation: 'Gemini', star1_id: 50, star2_id: 51 },
  { constellation: 'Gemini', star1_id: 51, star2_id: 52 },
  { constellation: 'Gemini', star1_id: 52, star2_id: 50 },
  { constellation: 'Taurus', star1_id: 56, star2_id: 57 },
  { constellation: 'Taurus', star1_id: 57, star2_id: 58 },
  { constellation: 'Leo', star1_id: 47, star2_id: 48 },
  { constellation: 'Leo', star1_id: 48, star2_id: 49 },
  { constellation: 'Leo', star1_id: 49, star2_id: 47 },
  { constellation: 'Virgo', star1_id: 44, star2_id: 45 },
  { constellation: 'Virgo', star1_id: 45, star2_id: 46 },
  { constellation: 'Scorpius', star1_id: 39, star2_id: 40 },
  { constellation: 'Scorpius', star1_id: 40, star2_id: 41 },
  { constellation: 'Cygnus', star1_id: 30, star2_id: 31 },
  { constellation: 'Cygnus', star1_id: 31, star2_id: 32 },
  { constellation: 'Cygnus', star1_id: 32, star2_id: 30 },
  { constellation: 'Lyra', star1_id: 33, star2_id: 34 },
  { constellation: 'Lyra', star1_id: 34, star2_id: 35 },
  { constellation: 'Lyra', star1_id: 35, star2_id: 33 },
  { constellation: 'Aquila', star1_id: 36, star2_id: 37 },
  { constellation: 'Aquila', star1_id: 37, star2_id: 38 },
  { constellation: 'Aquila', star1_id: 38, star2_id: 36 },
  { constellation: 'Boötes', star1_id: 42, star2_id: 43 },
  { constellation: 'Andromeda', star1_id: 23, star2_id: 24 },
  { constellation: 'Andromeda', star1_id: 24, star2_id: 25 },
  { constellation: 'Perseus', star1_id: 26, star2_id: 27 },
  { constellation: 'Cassiopeia', star1_id: 28, star2_id: 29 },
  { constellation: 'Canis Major', star1_id: 59, star2_id: 60 },
  { constellation: 'Canis Major', star1_id: 60, star2_id: 61 },
  { constellation: 'Canis Minor', star1_id: 62, star2_id: 63 },
  { constellation: 'Auriga', star1_id: 53, star2_id: 54 },
  { constellation: 'Auriga', star1_id: 54, star2_id: 55 },
];

export const epochs: EpochData[] = [
  { epoch: 'J2000', obliquity: 23.4392911, precession_rate: 50.290966 },
  { epoch: 'J1950', obliquity: 23.4457889, precession_rate: 50.279700 },
  { epoch: 'J2050', obliquity: 23.4328000, precession_rate: 50.283000 },
  { epoch: 'B1900', obliquity: 23.4522940, precession_rate: 50.256400 },
];

export function getAllStars(): Star[] {
  return stars;
}

export function getStarById(id: number): Star | undefined {
  return stars.find(star => star.id === id);
}

export function getEpochData(epoch: string): EpochData | undefined {
  return epochs.find(e => e.epoch === epoch);
}

export function getAllConstellationLines(): ConstellationLine[] {
  return constellationLines;
}

export function getConstellationLines(constellation: string): ConstellationLine[] {
  return constellationLines.filter(line => line.constellation === constellation);
}