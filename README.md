# Sector file tools

Utilities for working with SCT, ASR and ESE files.
This library can parse these files, and format them as GeoJSON data. 

Usage:

```
import { parseSct } from 'sector-file-tools';
import { parseSct, parseEse, parseAsr, toGeoJson } from 'sector-file-tools';

const sct = parseSct2('.....');
const ese = parseEse2('.....');
const asr = parseAsr2('.....');
const geojson = toGeoJson(sct, ese, asr);

console.log(geojson); // data
```

