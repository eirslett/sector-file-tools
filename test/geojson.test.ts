import { ASR, Color, ESE, parseSct, Position, SCT, toGeoJson } from '../src';
import { expect } from 'chai';
import { Geo } from '../src/sct';

const emptyAsr: ASR = {
    sectorFile: '',
    sectorTitle: '',
    artcc: [],
    artccHigh: [],
    artccLow: [],
    freetext: {},
    geo: [],
    regions: [],
    stars: [],
    vors: [],
    ndbs: [],
    fixes: [],
    runways: {},
    viewport: null,
};

const emptySct: SCT = {
    info: {},
    defines: {},
    vor: [],
    ndb: [],
    fixes: [],
    airports: [],
    runways: [],
    artcc: [],
    artccHigh: [],
    artccLow: [],
    sid: [],
    star: [],
    highAirway: [],
    lowAirway: [],
    geo: [],
    regions: [],
    labels: [],
};

const emptyEse: ESE = {
    freetext: {},
    positions: [],
};

describe('Generate GeoJSON', function () {
    it('outputs a FeatureCollection', function () {
        expect(toGeoJson(emptySct, emptyEse, emptyAsr)).to.eql({
            type: 'FeatureCollection',
            features: [],
        });
    });

    it('converts airport to a Point feature', function () {
        const output = toGeoJson(
            {
                ...emptySct,
                vor: [
                    {
                        id: 'GRM',
                        frequency: '115.950',
                        position: Position.latlon('N060.11.30.328', 'E011.04.27.908'),
                    },
                ],
            },
            emptyEse,
            null,
            'WGS84'
        );

        expect(output.features).to.eql([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [11.074419, 60.191758],
                },
                properties: {
                    type: 'vor',
                    name: 'GRM',
                    freq: '115.950',
                },
            },
        ]);
    });

    it('converts fix to a Point feature', function () {
        const output = toGeoJson(
            {
                ...emptySct,
                fixes: [
                    { id: 'BAVAD', position: Position.latlon('N060.27.57.999', 'E011.05.03.998') },
                ],
            },
            emptyEse,
            null,
            'WGS84'
        );

        expect(output.features).to.eql([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [11.084444, 60.466111],
                },
                properties: {
                    type: 'fix',
                    name: 'BAVAD',
                },
            },
        ]);
    });

    it('converts STAR to a set of LineString features with same section name', function () {
        const output = toGeoJson(
            {
                ...emptySct,
                star: [
                    {
                        id: 'ENGM STARS RWY 01',
                        segments: [
                            {
                                start: {
                                    id: 'ADOPI',
                                    position: Position.latlon('N060.19.24.999', 'E009.22.59.998'),
                                },
                                end: {
                                    id: 'NIVDU',
                                    position: Position.latlon('N060.16.19.999', 'E009.51.50.000'),
                                },
                                color: Color.withNameAndValue('COLOR_APP', 13158600),
                            },
                            {
                                start: {
                                    id: 'NIVDU',
                                    position: Position.latlon('N060.16.19.999', 'E009.51.50.000'),
                                },
                                end: {
                                    id: 'GM402',
                                    position: Position.latlon('N060.07.49.101', 'E010.15.10.198'),
                                },
                                color: null,
                            },
                        ],
                    },
                ],
            },
            emptyEse,
            null,
            'WGS84'
        );

        expect(output.features).to.eql([
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [9.383333, 60.323611],
                        [9.863889, 60.272222],
                    ],
                },
                properties: {
                    type: 'star',
                    color: [200, 200, 200],
                    section: 'ENGM STARS RWY 01',
                },
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [9.863889, 60.272222],
                        [10.252833, 60.130306],
                    ],
                },
                properties: {
                    type: 'star',
                    section: 'ENGM STARS RWY 01',
                    color: undefined,
                },
            },
        ]);
    });

    it('converts an ARTCC Low to a set of LineString features', function () {
        const result = toGeoJson(
            {
                ...emptySct,
                artccLow: [
                    {
                        id: 'CTR - ENGM',
                        segments: [
                            {
                                start: Position.latlon('N060.01.54.946', 'E011.00.16.024'),
                                end: Position.latlon('N060.00.47.000', 'E011.08.04.000'),
                                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
                            },
                            {
                                start: Position.latlon('N060.22.43.211', 'E011.12.19.529'),
                                end: Position.latlon('N060.22.16.000', 'E011.15.25.000'),
                                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
                            },
                            {
                                start: Position.latlon('N060.00.47.000', 'E011.08.04.000'),
                                end: Position.latlon('N060.12.18.000', 'E011.17.31.000'),
                                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
                            },
                        ],
                    },
                ],
            },
            emptyEse,
            emptyAsr,
            'WGS84'
        );

        expect(result.features).to.eql([
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [11.004451, 60.031929],
                        [11.134444, 60.013056],
                    ],
                },
                properties: {
                    type: 'artcc-low',
                    color: [200, 200, 200],
                    section: 'CTR - ENGM',
                },
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [11.205425, 60.37867],
                        [11.256944, 60.371111],
                    ],
                },
                properties: {
                    type: 'artcc-low',
                    section: 'CTR - ENGM',
                    color: [200, 200, 200],
                },
            },
            {
                geometry: {
                    coordinates: [
                        [11.134444, 60.013056],
                        [11.291944, 60.205],
                    ],
                    type: 'LineString',
                },
                properties: {
                    color: [200, 200, 200],
                    section: 'CTR - ENGM',
                    type: 'artcc-low',
                },
                type: 'Feature',
            },
        ]);
    });

    it('converts label and freetext to Point feature', function () {
        const output = toGeoJson(
            {
                ...emptySct,
                labels: [
                    {
                        text: 'VORMSUND',
                        position: Position.latlon('N060.09.18.000', 'E011.25.05.000'),
                        color: Color.withNameAndValue('FREETEXT_COLOR', 13158600),
                    },
                ],
            },
            {
                ...emptyEse,
                freetext: {
                    'ENGM VFR Reporting Points': [
                        {
                            position: Position.latlon('N060.13.03.000', 'E010.58.15.000'),
                            text: 'NANNESTAD',
                            color: Color.withNameAndValue('FREETEXT_COLOR', 13158600),
                        },
                        {
                            position: Position.latlon('N060.11.05.000', 'E011.15.50.000'),
                            text: 'NORDKISA',
                            color: null,
                        },
                    ],
                },
            },
            null,
            'WGS84'
        );

        expect(output.features).to.eql([
            {
                geometry: {
                    coordinates: [11.418056, 60.155],
                    type: 'Point',
                },
                properties: {
                    type: 'label',
                    value: 'VORMSUND',
                    color: [200, 200, 200],
                },
                type: 'Feature',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [10.970833, 60.2175],
                },
                properties: {
                    section: 'ENGM VFR Reporting Points',
                    type: 'label',
                    value: 'NANNESTAD',
                    color: [200, 200, 200],
                },
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [11.263889, 60.184722],
                },
                properties: {
                    section: 'ENGM VFR Reporting Points',
                    type: 'label',
                    value: 'NORDKISA',
                    color: undefined,
                },
            },
        ]);
    });

    it('converts region to a set of Polygons', function () {
        const result = toGeoJson(
            {
                ...emptySct,
                regions: [
                    {
                        id: 'ENML',
                        polygons: [
                            {
                                color: Color.withNameAndValue('COLOR_Building', 3881787),
                                points: [
                                    Position.latlon('N062.44.43.705', 'E007.15.21.800'),
                                    Position.latlon('N062.44.43.497', 'E007.15.23.427'),
                                    Position.latlon('N062.44.44.006', 'E007.15.23.717'),
                                    Position.latlon('N062.44.44.210', 'E007.15.22.090'),
                                ],
                            },
                            {
                                color: Color.withNameAndValue('COLOR_Building', 3881787),
                                points: [
                                    Position.latlon('N062.44.44.522', 'E007.15.22.181'),
                                    Position.latlon('N062.44.44.062', 'E007.15.23.796'),
                                    Position.latlon('N062.44.44.752', 'E007.15.24.710'),
                                    Position.latlon('N062.44.45.209', 'E007.15.23.095'),
                                ],
                            },
                        ],
                    },
                ],
            },
            emptyEse,
            null,
            'WGS84'
        );

        expect(result.features).to.eql([
            {
                geometry: {
                    coordinates: [
                        [
                            [7.256056, 62.745474],
                            [7.256508, 62.745416],
                            [7.256588, 62.745557],
                            [7.256136, 62.745614],
                        ],
                    ],
                    type: 'Polygon',
                },
                properties: {
                    color: [59, 59, 59],
                    region: 'ENML',
                    type: 'region',
                },
                type: 'Feature',
            },
            {
                geometry: {
                    coordinates: [
                        [
                            [7.256161, 62.745701],
                            [7.25661, 62.745573],
                            [7.256864, 62.745764],
                            [7.256415, 62.745891],
                        ],
                    ],
                    type: 'Polygon',
                },
                properties: {
                    color: [59, 59, 59],
                    region: 'ENML',
                    type: 'region',
                },
                type: 'Feature',
            },
        ]);
    });
});

describe('Use ASR to determine which features to include in GeoJSON output', function () {
    it('picks only the ARTCCs defined in the ASR', function () {
        const result = toGeoJson(
            {
                ...emptySct,
                artcc: makeDummyArtccs(['ARTCC-1', 'ARTCC-2', 'ARTCC-3']),
                artccLow: makeDummyArtccs(['ARTCC-LOW-1', 'ARTCC-LOW-2', 'ARTCC-LOW-3']),
                artccHigh: makeDummyArtccs(['ARTCC-HIGH-1', 'ARTCC-HIGH-2', 'ARTCC-HIGH-3']),
            },
            emptyEse,
            {
                ...emptyAsr,
                artcc: ['ARTCC-1'],
                artccLow: ['ARTCC-LOW-1'],
                artccHigh: ['ARTCC-HIGH-2', 'ARTCC-HIGH-3'],
            }
        );

        const unique = [...new Set(result.features.map((feature) => feature.properties!.section))];

        expect(unique).to.eql(['ARTCC-1', 'ARTCC-LOW-1', 'ARTCC-HIGH-2', 'ARTCC-HIGH-3']);
    });
});

function makeDummyArtccs(ids: string[]): Geo[] {
    return ids.map((id) => ({
        id,
        segments: [
            {
                start: Position.latlon('N060.01.54.946', 'E011.00.16.024'),
                end: Position.latlon('N060.00.47.000', 'E011.08.04.000'),
                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
            },
            {
                start: Position.latlon('N060.22.43.211', 'E011.12.19.529'),
                end: Position.latlon('N060.22.16.000', 'E011.15.25.000'),
                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
            },
            {
                start: Position.latlon('N060.00.47.000', 'E011.08.04.000'),
                end: Position.latlon('N060.12.18.000', 'E011.17.31.000'),
                color: Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
            },
        ],
    }));
}
