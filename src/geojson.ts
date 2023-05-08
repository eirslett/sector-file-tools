import { Position } from './position.js';
import { Airport, FIX, Geo, Label, Navaid, NDB, Region, Runway, SCT, VOR } from './sct.js';
import type { Feature, FeatureCollection } from 'geojson';
import { ASR } from './asr.js';
import { ESE } from './ese.js';

function regionToGeo(region: Region, utm_coord: boolean | true): Feature<any>[] {
    return region.polygons.map((polygon) => ({
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: utm_coord ?
                [polygon.points.map((point) => point.toUTM())] : // utm_coord is true
                [polygon.points.map((point) => point.toWGS84())], // utm_coord is false
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

function geoToGeo(geo: Geo, utm_coord: boolean | true): Feature[] {
    return geo.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: utm_coord ?
                [toUtm(segment.start), toUtm(segment.end)] : // utm_coord is true
                [toWGS84(segment.start), toWGS84(segment.end)], // utm_coord is false
        },
        properties: {
            type: 'geo',
            section: geo.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function airportToGeo(airport: Airport, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                airport.position.toUTM() : // utm_coord is true
                airport.position.toWGS84(), // utm_coord is false
        },
        properties: {
            name: airport.id,
            type: 'airport',
        },
    };
}

function vorToGeo(vor: VOR, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                vor.position.toUTM() : // utm_coord is true
                vor.position.toWGS84(), // utm_coord is false
        },
        properties: {
            name: vor.id,
            freq: vor.frequency,
            type: 'vor',
        },
    };
}

function ndbToGeo(ndb: NDB, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                ndb.position.toUTM() : // utm_coord is true
                ndb.position.toWGS84(), // utm_coord is false
        },
        properties: {
            name: ndb.id,
            freq: ndb.frequency,
            type: 'ndb',
        },
    };
}

function fixToGeo(fix: FIX, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                fix.position.toUTM() : // utm_coord is true
                fix.position.toWGS84(), // utm_coord is false
        },
        properties: {
            name: fix.id,
            type: 'fix',
        },
    };
}

function labelToGeo(label: Label, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                label.position.toUTM() : // utm_coord is true
                label.position.toWGS84(), // utm_coord is false
        },
        properties: {
            value: label.text,
            type: 'label',
        },
    };
}

function freetextToGeo(section: string, label: Label, utm_coord: boolean | true): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: utm_coord ?
                label.position.toUTM() : // utm_coord is true
                label.position.toWGS84(), // utm_coord is false
        },
        properties: {
            section,
            value: label.text,
            type: 'label',
        },
    };
}

function runwayToGeo(runway: Runway, utm_coord: boolean | true): Feature {
    const id = `${runway.icao}: ${runway.id}`;
    return {
        id,
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: utm_coord ?
                [runway.start.toUTM(), runway.end.toUTM()] : // utm_coord is true
                [runway.start.toWGS84(), runway.end.toWGS84()], // utm_coord is false
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

function sidToGeo(sid: Geo, utm_coord: boolean | true): Feature[] {
    return sid.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: utm_coord ?
                [toUtm(segment.start), toUtm(segment.end)] : // utm_coord is true
                [toWGS84(segment.start), toWGS84(segment.end)], // utm_coord is false
        },
        properties: {
            type: 'sid',
            section: sid.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function starToGeo(star: Geo, utm_coord: boolean | true): Feature[] {
    return star.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: utm_coord ?
                [toUtm(segment.start), toUtm(segment.end)] : // utm_coord is true
                [toWGS84(segment.start), toWGS84(segment.end)], // utm_coord is false
        },
        properties: {
            type: 'star',
            section: star.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function flatten<T>(arr: T[][]): T[] {
    return ([] as T[]).concat(...arr);
}

export function toGeoJson(sct: SCT, ese: ESE, asr: ASR | null, utm_coord: boolean | true): FeatureCollection {
    const features: Feature[] = flatten([
        flatten(
            sct.regions
                .filter((region) => (asr != null ? asr.regions.includes(region.id) : true))
                .map(element => regionToGeo(element, utm_coord))
        ),
        flatten(
            sct.geo.filter((geo) => (asr != null ? asr.geo.includes(geo.id) : true)).map(element => geoToGeo(element, utm_coord))
        ),
        sct.airports.map(element => airportToGeo(element, utm_coord)),
        sct.runways
            .filter((runway) => {
                if (asr == null) {
                    return true;
                }
                const fullName = `${runway.icao} ${runway.airportName} ${runway.id}-${runway.oppositeId}`;
                return Object.keys(asr.runways).includes(fullName);
            })
            .map(element => runwayToGeo(element, utm_coord)),
        sct.vor.filter((vor) => (asr != null ? asr.vors.includes(vor.id) : true)).map(element => vorToGeo(element, utm_coord)),
        sct.ndb.filter((ndb) => (asr != null ? asr.ndbs.includes(ndb.id) : true)).map(element => ndbToGeo(element, utm_coord)),
        sct.fixes.filter((fix) => (asr != null ? asr.fixes.includes(fix.id) : true)).map(element => fixToGeo(element, utm_coord)),
        flatten(sct.sid.map(element => sidToGeo(element, utm_coord))),
        flatten(
            sct.star
                .filter((star) => (asr != null ? asr.stars.includes(star.id) : true))
                .map(element => starToGeo(element, utm_coord))
        ),
        sct.labels.map(element => labelToGeo(element, utm_coord)),
        flatten(
            Object.entries(ese.freetext).map(([section, labels]) =>
                labels
                    .filter((label) =>
                        asr != null
                            ? asr.freetext[section] != null &&
                              asr.freetext[section].includes(label.text)
                            : true
                    )
                    .map((label) => freetextToGeo(section, label, utm_coord))
            )
        ),
    ]);

    return {
        type: 'FeatureCollection',
        features,
    };
}
