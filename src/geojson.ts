import { Position } from './position.js';
import { Airport, FIX, Geo, Label, Navaid, NDB, Region, Runway, SCT, VOR } from './sct.js';
import type { Feature, FeatureCollection } from 'geojson';
import { ASR } from './asr.js';
import { ESE } from './ese.js';

export type CoordinateSystem = 'UTM' | 'WGS84';

function regionToGeo(region: Region, system: CoordinateSystem = 'UTM'): Feature<any>[] {
    return region.polygons.map((polygon) => ({
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates:
                system === 'UTM'
                    ? [polygon.points.map((point) => point.toUTM())] // Coordinate system is UTM
                    : [polygon.points.map((point) => point.toWGS84())], // Coordinate system is WGS84
        },
        properties: {
            type: 'region',
            region: region.id,
            color: polygon.color.toRGB(),
        },
    }));
}

function toUtm(point: Position | Navaid): [number, number] {
    if ((point as any).position != undefined) {
        return (point as Navaid).position.toUTM();
    } else {
        return (point as Position).toUTM();
    }
}

function toWGS84(point: Position | Navaid): [number, number] {
    if ((point as any).position != undefined) {
        return (point as Navaid).position.toWGS84();
    } else {
        return (point as Position).toWGS84();
    }
}

function geoToGeo(geo: Geo, type: string, system: CoordinateSystem = 'UTM'): Feature[] {
    return geo.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates:
                system === 'UTM'
                    ? [toUtm(segment.start), toUtm(segment.end)] // Coordinate system is UTM
                    : [toWGS84(segment.start), toWGS84(segment.end)], // Coordinate system is WGS84
        },
        properties: {
            type: type,
            section: geo.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function airportToGeo(airport: Airport, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? airport.position.toUTM() // Coordinate system is UTM
                    : airport.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            name: airport.id,
            type: 'airport',
        },
    };
}

function vorToGeo(vor: VOR, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? vor.position.toUTM() // Coordinate system is UTM
                    : vor.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            name: vor.id,
            freq: vor.frequency,
            type: 'vor',
        },
    };
}

function ndbToGeo(ndb: NDB, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? ndb.position.toUTM() // Coordinate system is UTM
                    : ndb.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            name: ndb.id,
            freq: ndb.frequency,
            type: 'ndb',
        },
    };
}

function fixToGeo(fix: FIX, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? fix.position.toUTM() // Coordinate system is UTM
                    : fix.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            name: fix.id,
            type: 'fix',
        },
    };
}

function labelToGeo(label: Label, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? label.position.toUTM() // Coordinate system is UTM
                    : label.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            value: label.text,
            type: 'label',
            color: label.color?.toRGB(),
        },
    };
}

function freetextToGeo(section: string, label: Label, system: CoordinateSystem = 'UTM'): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates:
                system === 'UTM'
                    ? label.position.toUTM() // Coordinate system is UTM
                    : label.position.toWGS84(), // Coordinate system is WGS84
        },
        properties: {
            section,
            value: label.text,
            type: 'label',
            color: label.color?.toRGB(),
        },
    };
}

function runwayToGeo(runway: Runway, system: CoordinateSystem = 'UTM'): Feature {
    const id = `${runway.icao}: ${runway.id}`;
    return {
        id,
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates:
                system === 'UTM'
                    ? [runway.start.toUTM(), runway.end.toUTM()] // Coordinate system is UTM
                    : [runway.start.toWGS84(), runway.end.toWGS84()], // Coordinate system is WGS84
        },
        properties: {
            name: runway.id,
            oppositeId: runway.oppositeId,
            type: 'runway',
            icao: runway.icao,
            airport: runway.airportName,
        },
    };
}

function flatten<T>(arr: T[][]): T[] {
    return ([] as T[]).concat(...arr);
}

export function toGeoJson(
    sct: SCT,
    ese: ESE,
    asr: ASR | null,
    system: CoordinateSystem = 'UTM'
): FeatureCollection {
    const features: Feature[] = flatten([
        sct.regions
            .filter((region) => (asr != null ? asr.regions.includes(region.id) : true))
            .flatMap((element) => regionToGeo(element, system)),
        sct.geo
            .filter((geo) => (asr != null ? asr.geo.includes(geo.id) : true))
            .flatMap((element) => geoToGeo(element, 'geo', system)),
        sct.airports.map((element) => airportToGeo(element, system)),
        sct.runways
            .filter((runway) => {
                if (asr == null) {
                    return true;
                }
                const fullName = `${runway.icao} ${runway.airportName} ${runway.id}-${runway.oppositeId}`;
                return Object.keys(asr.runways).includes(fullName);
            })
            .map((element) => runwayToGeo(element, system)),
        sct.vor
            .filter((vor) => (asr != null ? asr.vors.includes(vor.id) : true))
            .map((element) => vorToGeo(element, system)),
        sct.ndb
            .filter((ndb) => (asr != null ? asr.ndbs.includes(ndb.id) : true))
            .map((element) => ndbToGeo(element, system)),
        sct.fixes
            .filter((fix) => (asr != null ? asr.fixes.includes(fix.id) : true))
            .map((element) => fixToGeo(element, system)),
        sct.sid.flatMap((element) => geoToGeo(element, 'sid', system)),
        sct.star
            .filter((star) => (asr != null ? asr.stars.includes(star.id) : true))
            .flatMap((element) => geoToGeo(element, 'star', system)),
        sct.labels.map((element) => labelToGeo(element, system)),
        Object.entries(ese.freetext).flatMap(([section, labels]) =>
            labels
                .filter((label) =>
                    asr != null
                        ? asr.freetext[section] != null &&
                          asr.freetext[section].includes(label.text)
                        : true
                )
                .map((label) => freetextToGeo(section, label, system))
        ),
        sct.artcc.flatMap((artcc) => geoToGeo(artcc, 'artcc', system)),
        sct.artccLow.flatMap((artcc) => geoToGeo(artcc, 'artcc-low', system)),
        sct.artccHigh.flatMap((artcc) => geoToGeo(artcc, 'artcc-high', system)),
        sct.highAirway.flatMap((airway) => geoToGeo(airway, 'high-airway', system)),
        sct.lowAirway.flatMap((airway) => geoToGeo(airway, 'low-airway', system)),
    ]);

    return {
        type: 'FeatureCollection',
        features,
    };
}
