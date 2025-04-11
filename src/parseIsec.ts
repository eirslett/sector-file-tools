import { Position } from './position.js';
import { Navaid } from './sct.js';

export default function parseIsec(input: string): Navaid[] {

    const navaids: Navaid[] = [];

    input
        .split('\n')
        .filter(line => line && !line.trim().startsWith(';'))
        .map((str) => str.trim().split(/\s+/))
        .filter((parts) => parts.length >= 3)
        .forEach((parts) => {
            console.log(parts);
            const [fixname, lat, lon] = parts;
            navaids.push({
                id: fixname,
                position: Position.latlonFloat(parseFloat(lat), parseFloat(lon)),
            })
        });

    return navaids;
}
