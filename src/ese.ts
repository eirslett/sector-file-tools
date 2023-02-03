import { Position } from './position.js';
import { Label } from './sct.js';

export interface ATCPosition {
    name: string;
    radioCallsign: string;
    frequency: string;
    identifier: string;
    middleLetter: string;
    prefix: string;
    suffix: string;
    startRange: number;
    endRange: number;
    centers: Position[];
}

export type Freetexts = { [section: string]: Label[] };

export interface ESE {
    freetext: Freetexts;
    positions: ATCPosition[];
}
