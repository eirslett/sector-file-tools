import { Position } from './position';
import { Color } from './color';
import { Info } from './sct/info';

export interface Navaid {
    id: string;
    position: Position;
}
export interface VOR extends Navaid {
    frequency: string;
}
export interface NDB extends Navaid {
    frequency: string;
}
export interface FIX extends Navaid {}

export interface Airport {
    id: string;
    frequency: string;
    position: Position;
    airportClass: string;
}
export interface Runway {
    id: string;
    oppositeId: string;
    heading: number;
    oppositeHeading: number;
    start: Position;
    end: Position;
    icao: string;
    airportName: string;
}
export interface Segment {
    start: Position | Navaid;
    end: Position | Navaid;
    color: Color | null;
}
export interface Geo {
    id: string;
    segments: Segment[];
}

export interface Polygon {
    color: Color;
    points: Position[];
}
export interface Region {
    id: string;
    polygons: Polygon[];
}
export interface Label {
    text: string;
    position: Position;
    color: Color | null;
}

export interface SCT {
    info: Info;
    defines: { [key: string]: Color };
    vor: VOR[];
    ndb: NDB[];
    fixes: FIX[];
    airports: Airport[];
    runways: Runway[];
    artcc: Geo[];
    artccHigh: Geo[];
    artccLow: Geo[];
    sid: Geo[];
    star: Geo[];
    highAirway: Geo[];
    lowAirway: Geo[];
    geo: Geo[];
    regions: Region[];
    labels: Label[];
}
