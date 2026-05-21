import {
  stars,
  constellationLines,
  epochs,
  getAllStars as getMemoryStars,
  getStarById as getMemoryStarById,
  getEpochData as getMemoryEpochData,
  getAllConstellationLines as getMemoryConstellationLines,
  getConstellationLines as getMemoryConstellationLinesByName,
} from './stars';

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

export interface EpochData {
  epoch: string;
  obliquity: number;
  precession_rate: number;
}

export interface ConstellationLine {
  constellation: string;
  star1_id: number;
  star2_id: number;
}

export async function getAllStars(): Promise<Star[]> {
  return getMemoryStars();
}

export async function getStarById(id: number): Promise<Star | undefined> {
  return getMemoryStarById(id);
}

export async function getEpochData(epoch: string): Promise<EpochData | undefined> {
  return getMemoryEpochData(epoch);
}

export async function getAllConstellationLines(): Promise<ConstellationLine[]> {
  return getMemoryConstellationLines();
}

export async function getConstellationLines(constellation: string): Promise<ConstellationLine[]> {
  return getMemoryConstellationLinesByName(constellation);
}

export { stars, constellationLines, epochs };