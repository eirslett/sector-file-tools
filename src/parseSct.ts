import { structuredInfo } from './sct/info.js';
import { isLatitude, isLongitude, Position } from './position.js';
import { Color } from './color.js';
import {
    Airport,
    FIX,
    Label,
    Navaid,
    NDB,
    Polygon,
    Region,
    Runway,
    SCT,
    Segment,
    VOR,
} from './sct';

const geoTypes = [
    'ARTCC',
    'ARTCC HIGH',
    'ARTCC LOW',
    'SID',
    'STAR',
    'HIGH AIRWAY',
    'LOW AIRWAY',
    'GEO',
] as const;

const sections = [
    ...geoTypes,
    'INFO',
    'VOR',
    'NDB',
    'FIXES',
    'AIRPORT',
    'RUNWAY',
    'REGIONS',
    'LABELS',
] as const;

type GeoType = (typeof geoTypes)[number];
type CurrentSection = (typeof sections)[number] | null;

const splitter = /[\t ]+/g;
function getParts(str: string): string[] {
    return str
        .split(';')[0]
        .trim()
        .split(splitter)
        .map((part) => part.trim());
}

export default function parseSct(input: string, isecNavaids?: Navaid[]): SCT {
    const lines = input.split('\n').map((line) => line.trim());

    const infoLines: string[] = [];
    const defines: { [key: string]: Color } = {};
    const vor: VOR[] = [];
    const ndb: NDB[] = [];
    const navaids: { [name: string]: Navaid } = isecNavaids ? Object.fromEntries(isecNavaids.map(navaid => [navaid.id, navaid])) : {};
    const fixes: FIX[] = [];
    const airports: Airport[] = [];
    const runways: Runway[] = [];
    const labels: Label[] = [];

    let currentRegion: string = '';
    const regionsByName: { [name: string]: Polygon[] } = {};

    function isNavaid(input: string): boolean {
        return navaids[input] != null;
    }

    let currentSection: CurrentSection = null;

    interface GeoSection {
        currentSection: string;
        sectionsByName: { [name: string]: Segment[] };
    }

    type CurrentGeo = { [key in GeoType]: GeoSection };

    const currentGeo: CurrentGeo = {
        ARTCC: {
            currentSection: '',
            sectionsByName: {},
        },
        'ARTCC HIGH': {
            currentSection: '',
            sectionsByName: {},
        },
        'ARTCC LOW': {
            currentSection: '',
            sectionsByName: {},
        },
        SID: {
            currentSection: '',
            sectionsByName: {},
        },
        STAR: {
            currentSection: '',
            sectionsByName: {},
        },
        'HIGH AIRWAY': {
            currentSection: '',
            sectionsByName: {},
        },
        'LOW AIRWAY': {
            currentSection: '',
            sectionsByName: {},
        },
        GEO: {
            currentSection: '',
            sectionsByName: {},
        },
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        function errorWithLine(message: string): Error {
            return new Error(`Error on line ${lineNumber}: ${message}`);
        }

        function parseGeo(type: GeoType): void {
            const parts = getParts(line);
            const last: string = parts[parts.length - 1];

            let title: string = '';
            let color: Color | null = null;
            let start: Position | Navaid;
            let end: Position | Navaid;

            function toStartEndPositions(
                startLat: string,
                startLon: string,
                endLat: string,
                endLon: string
            ): [Position | Navaid, Position | Navaid] {
                let start: Position | Navaid;
                if (isLatitude(startLat) && isLongitude(startLon)) {
                    start = Position.latlon(startLat, startLon);
                } else if (isNavaid(startLat)) {
                    start = navaids[startLat];
                } else {
                    throw errorWithLine(
                        `The input ${startLat} is neither a latitude or registered navaid.`
                    );
                }

                let end: Position | Navaid;
                if (isLatitude(endLat) && isLongitude(endLon)) {
                    end = Position.latlon(endLat, endLon);
                } else if (isNavaid(endLat)) {
                    end = navaids[endLat];
                } else {
                    throw errorWithLine(
                        `The input ${endLat} is neither a latitude or registered navaid.`
                    );
                }
                return [start, end];
            }

            if (isLongitude(last) || isNavaid(last)) {
                title = parts.slice(0, parts.length - 4).join(' ');
                const [startLat, startLon, endLat, endLon] = parts.slice(-4);

                [start, end] = toStartEndPositions(startLat, startLon, endLat, endLon);
            } else {
                const colorStr = last.toLowerCase();
                if (defines[colorStr]) {
                    color = defines[colorStr];
                } else {
                    throw errorWithLine(`The color ${colorStr} has not been defined.`);
                }

                title = parts.slice(0, parts.length - 5).join(' ');
                const [startLat, startLon, endLat, endLon] = parts.slice(-5);
                [start, end] = toStartEndPositions(startLat, startLon, endLat, endLon);
            }

            if (title.length > 0) {
                currentGeo[type].currentSection = title;
            }
            let current: string = currentGeo[type].currentSection;

            if (!currentGeo[type].sectionsByName[current]) {
                currentGeo[type].sectionsByName[current] = [];
            }
            currentGeo[type].sectionsByName[current].push({ start, end, color });
        }

        if (line === '') {
            continue;
        } else if (line.indexOf(';') === 0) {
            continue;
        } else if (line.indexOf('[') === 0) {
            const nameMatch = /\[(.*)\]/.exec(line);
            if (!nameMatch || nameMatch.length !== 2) {
                throw errorWithLine(
                    `Syntax error, expected [***] with some section name between the brackets.`
                );
            }
            const matchedName = nameMatch[1].toUpperCase();
            let matched: CurrentSection | undefined = sections.find(
                (section) => matchedName === section
            );
            if (matched === undefined) {
                throw errorWithLine(`Unknown section type "${matchedName}"`);
            }
            currentSection = matched;
        } else if (line.indexOf('#define') === 0) {
            const [, name, value] = line.split(/[\t ]/g).filter((el) => el.length > 0);
            const valueAsNumber = Number(value);
            if (Number.isNaN(valueAsNumber)) {
                throw errorWithLine(`Color ${name} must be defined as a number, got '${value}'.`);
            } else {
                defines[name.toLowerCase()] = Color.withNameAndValue(name, valueAsNumber);
            }
        } else if (currentSection === 'INFO') {
            infoLines.push(line);
        } else if (currentSection === 'VOR') {
            const parts = getParts(line);
            const [id, frequency, lat, lon] = parts;
            const position = Position.navaid(id, lat, lon);
            const data: VOR = {
                id,
                frequency,
                position,
            };
            vor.push(data);
            navaids[id] = data;
        } else if (currentSection === 'NDB') {
            const parts = getParts(line);
            const [id, frequency, lat, lon] = parts;
            const position = Position.navaid(id, lat, lon);
            const data = {
                id,
                frequency,
                position,
            };
            ndb.push(data);
            navaids[id] = data;
        } else if (currentSection === 'FIXES') {
            const parts = getParts(line);
            const [id, lat, lon] = parts;
            const position = Position.navaid(id, lat, lon);
            const data = {
                id,
                position,
            };
            fixes.push(data);
            navaids[id] = data;
        } else if (currentSection === 'AIRPORT') {
            const parts = getParts(line);
            const [id, frequency, lat, lon, airportClass] = parts;
            const position = Position.navaid(id, lat, lon);
            const data = {
                id,
                frequency,
                position,
                airportClass,
            };
            airports.push(data);
            navaids[id] = data;
        } else if (currentSection === 'RUNWAY') {
            const parts = getParts(line);
            const [
                id,
                oppositeId,
                heading,
                oppositeHeading,
                startLat,
                startLon,
                endLat,
                endLon,
                icao,
                airportName,
            ] = parts;
            const start = Position.latlon(startLat, startLon);
            const end = Position.latlon(endLat, endLon);

            const runway = {
                id,
                oppositeId,
                heading: parseFloat(heading),
                oppositeHeading: parseFloat(oppositeHeading),
                start,
                end,
                icao,
                airportName: airportName || '',
            };
            runways.push(runway);
        } else if (geoTypes.find((el) => el === currentSection) !== undefined) {
            parseGeo(currentSection as GeoType);
        } else if (currentSection === 'REGIONS') {
            if (line.indexOf('REGIONNAME') === 0) {
                currentRegion = line.slice(11).split(';')[0].trim();
                regionsByName[currentRegion] = regionsByName[currentRegion] || [];
            } else {
                const parts = getParts(line);
                const firstParts = parts
                    .slice(0, parts.length - 2)
                    .join(' ')
                    .trim();
                const [lat, lon] = parts.slice(-2);
                if (!isLatitude(lat)) {
                    throw errorWithLine('Expected a valid latitude, got ' + lat);
                }
                if (!isLongitude(lon)) {
                    throw errorWithLine('Expected a valid longitude, got ' + lat);
                }

                if (firstParts.length > 0) {
                    // name of a color - which should also start a new polygon
                    regionsByName[currentRegion].push({
                        color: defines[firstParts.toLowerCase()],
                        points: [],
                    });
                }

                regionsByName[currentRegion][regionsByName[currentRegion].length - 1].points.push(
                    Position.latlon(lat, lon)
                );
            }
        } else if (currentSection === 'LABELS') {
            const parts = getParts(line);
            const firstParts = parts
                .slice(0, parts.length - 3)
                .join(' ')
                .trim();
            const [lat, lon, color] = parts.slice(-3);
            labels.push({
                text: firstParts,
                position: Position.latlon(lat, lon),
                color: defines[color.toLowerCase()],
            });
        } else {
            throw errorWithLine('Unsure what this line really means');
        }
    }

    function getGeoData(geoType: GeoType) {
        return Object.entries(currentGeo[geoType].sectionsByName).map(([id, segments]) => ({
            id,
            segments,
        }));
    }

    const regions: Region[] = Object.entries(regionsByName).map(([id, polygons]) => ({
        id,
        polygons,
    }));

    const data: SCT = {
        info: structuredInfo(infoLines),
        defines,
        vor,
        ndb,
        fixes,
        airports,
        runways,
        artcc: getGeoData('ARTCC'),
        artccHigh: getGeoData('ARTCC HIGH'),
        artccLow: getGeoData('ARTCC LOW'),
        sid: getGeoData('SID'),
        star: getGeoData('STAR'),
        highAirway: getGeoData('HIGH AIRWAY'),
        lowAirway: getGeoData('LOW AIRWAY'),
        geo: getGeoData('GEO'),
        regions,
        labels,
    };

    return data;
}
