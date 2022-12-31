import { Position } from './position';
import { Airport, FIX, Geo, Label, Navaid, NDB, Region, Runway, SCT, VOR } from './sct';
import { Feature, FeatureCollection } from 'geojson';
import { ASR } from './asr';
import { ESE } from './ese';

function regionToGeo(region: Region): Feature<any>[] {
    return region.polygons.map((polygon) => ({
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [polygon.points.map((point) => point.toUTM())],
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

function geoToGeo(geo: Geo): Feature[] {
    return geo.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [toUtm(segment.start), toUtm(segment.end)],
        },
        properties: {
            type: 'geo',
            section: geo.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function airportToGeo(airport: Airport): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: airport.position.toUTM(),
        },
        properties: {
            name: airport.id,
            type: 'airport',
        },
    };
}

function vorToGeo(vor: VOR): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: vor.position.toUTM(),
        },
        properties: {
            name: vor.id,
            freq: vor.frequency,
            type: 'vor',
        },
    };
}

function ndbToGeo(ndb: NDB): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: ndb.position.toUTM(),
        },
        properties: {
            name: ndb.id,
            freq: ndb.frequency,
            type: 'ndb',
        },
    };
}

function fixToGeo(fix: FIX): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: fix.position.toUTM(),
        },
        properties: {
            name: fix.id,
            type: 'fix',
        },
    };
}

function labelToGeo(label: Label): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: label.position.toUTM(),
        },
        properties: {
            value: label.text,
            type: 'label',
        },
    };
}

function freetextToGeo(section: string, label: Label): Feature {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: label.position.toUTM(),
        },
        properties: {
            section,
            value: label.text,
            type: 'label',
        },
    };
}

function runwayToGeo(runway: Runway): Feature {
    const id = `${runway.icao}: ${runway.id}`;
    return {
        id,
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [runway.start.toUTM(), runway.end.toUTM()],
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

function sidToGeo(sid: Geo): Feature[] {
    return sid.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [toUtm(segment.start), toUtm(segment.end)],
        },
        properties: {
            type: 'sid',
            section: sid.id,
            color: segment.color?.toRGB(),
        },
    }));
}

function starToGeo(star: Geo): Feature[] {
    return star.segments.map((segment) => ({
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [toUtm(segment.start), toUtm(segment.end)],
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

export function toGeoJson(sct: SCT, ese: ESE, asr: ASR | null): FeatureCollection {
    const features: Feature[] = flatten([
        flatten(
            sct.regions
                .filter((region) => (asr != null ? asr.regions.includes(region.id) : true))
                .map(regionToGeo)
        ),
        flatten(
            sct.geo.filter((geo) => (asr != null ? asr.geo.includes(geo.id) : true)).map(geoToGeo)
        ),
        sct.airports.map(airportToGeo),
        sct.runways
            .filter((runway) => {
                if (asr == null) {
                    return true;
                }
                const fullName = `${runway.icao} ${runway.airportName} ${runway.id}-${runway.oppositeId}`;
                return Object.keys(asr.runways).includes(fullName);
            })
            .map(runwayToGeo),
        sct.vor.filter((vor) => (asr != null ? asr.vors.includes(vor.id) : true)).map(vorToGeo),
        sct.ndb.filter((ndb) => (asr != null ? asr.ndbs.includes(ndb.id) : true)).map(ndbToGeo),
        sct.fixes.filter((fix) => (asr != null ? asr.fixes.includes(fix.id) : true)).map(fixToGeo),
        flatten(sct.sid.map(sidToGeo)),
        flatten(
            sct.star
                .filter((star) => (asr != null ? asr.stars.includes(star.id) : true))
                .map(starToGeo)
        ),
        sct.labels.map(labelToGeo),
        flatten(
            Object.entries(ese.freetext).map(([section, labels]) =>
                labels
                    .filter((label) =>
                        asr != null
                            ? asr.freetext[section] != null &&
                              asr.freetext[section].includes(label.text)
                            : true
                    )
                    .map((label) => freetextToGeo(section, label))
            )
        ),
    ]);

    return {
        type: 'FeatureCollection',
        features,
    };
}
