import {Position} from "../position";

export type Info = {
    sectorFilename?: string
    defaultCallsign?: string
    defaultAirport?: string
    center?: Position
    nmPerLatDegree?: number
    nmPerLonDegree?: number
    magneticVariation?: number
    sectorScale?: number
};

export function structuredInfo(lines: string[]): Info {
    const map: Info = {};

    const [
        sectorFilename,
        defaultCallsign,
        defaultAirport,
        lat,
        lon,
        nmPerLatDegree,
        nmPerLonDegree,
        magneticVariation,
        sectorScale
    ] = lines;

    if (sectorFilename !== undefined) {
        map.sectorFilename = sectorFilename;
    }
    if (defaultCallsign !== undefined) {
        map.defaultCallsign = defaultCallsign;
    }
    if (defaultAirport !== undefined) {
        map.defaultAirport = defaultAirport;
    }
    if (lat !== undefined && lon !== undefined) {
        map.center = Position.latlon(lat, lon);
    }
    if (nmPerLatDegree !== undefined) {
        map.nmPerLatDegree = parseInt(nmPerLatDegree);
    }
    if (nmPerLonDegree !== undefined) {
        map.nmPerLonDegree = parseInt(nmPerLonDegree);
    }
    if (magneticVariation !== undefined) {
        map.magneticVariation = parseInt(magneticVariation);
    }
    if (sectorScale !== undefined) {
        map.sectorScale = parseInt(sectorScale);
    }

    return map;
}
