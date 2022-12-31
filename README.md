# Sector file tools

Utilities for working with SCT, ASR and ESE files.
This library can parse these files, and format them as GeoJSON data.

Install:

```
npm install sector-file-tools
```

Usage:

```
import { parseSct } from 'sector-file-tools';
import { parseSct, parseEse, parseAsr, toGeoJson } from 'sector-file-tools';

const sct = parseSct('.....');
const ese = parseEse('.....');
const asr = parseAsr('.....');
const geojson = toGeoJson(sct, ese, asr);

console.log(geojson); // data
```
