import { expect } from 'chai';
import { SCT, parseSct, Position, Color } from '../src';

const empty: SCT = {
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
    lowAirway: [],
    highAirway: [],
    geo: [],
    regions: [],
    labels: [],
};

describe('Parse SCT', function () {
    it('can parse empty string', function () {
        expect(parseSct('')).to.deep.equal(empty);
    });

    it('skips empty lines', function () {
        expect(parseSct('\n\n\n')).to.deep.equal(empty);
    });

    it('skips comments', function () {
        expect(parseSct(';comment\n\n\n')).to.deep.equal(empty);
    });

    it('fails on unknown sections', function () {
        expect(() => parseSct('\n\n[OoPs]\nfoo bar')).to.throw(
            Error,
            'Error on line 3: Unknown section type "OOPS"'
        );
    });

    it('read info', function () {
        expect(
            parseSct(`
[INFO]
Norway 1913/1-2 ENOR 20191205
AERO_NAV
ZZZZ
N060.12.10.000
E011.05.02.000
60
25
-0
1
        `)
        ).to.deep.equal({
            ...empty,
            info: {
                sectorFilename: 'Norway 1913/1-2 ENOR 20191205',
                defaultCallsign: 'AERO_NAV',
                defaultAirport: 'ZZZZ',
                center: Position.latlon('N060.12.10.000', 'E011.05.02.000'),
                nmPerLatDegree: 60,
                nmPerLonDegree: 25,
                magneticVariation: -0,
                sectorScale: 1,
            },
        });
    });

    it('read defines (stored lowercase for case-insensitivity)', function () {
        expect(parseSct('#define    COLOR_Building  3881787 ; test comment')).to.deep.equal({
            ...empty,
            defines: {
                color_building: Color.withNameAndValue('COLOR_Building', 3881787),
            },
        });
    });

    it('read VOR', function () {
        expect(
            parseSct('[VOR]\nAAL  116.700 N057.06.14.158 E009.59.34.108 ; test comment')
        ).to.deep.equal({
            ...empty,
            vor: [
                {
                    id: 'AAL',
                    frequency: '116.700',
                    position: Position.latlon('N057.06.14.158', 'E009.59.34.108'),
                },
            ],
        });
    });

    it('read NDB', function () {
        expect(
            parseSct('[NDB]\nHEI  340.000 N065.19.32.008 E007.18.57.088 ; test comment')
        ).to.deep.equal({
            ...empty,
            ndb: [
                {
                    id: 'HEI',
                    frequency: '340.000',
                    position: Position.latlon('N065.19.32.008', 'E007.18.57.088'),
                },
            ],
        });
    });

    it('read FIXes', function () {
        expect(
            parseSct('[FIXES]\n02RYG N059.21.23.579 E010.52.14.581 ; test comment')
        ).to.deep.equal({
            ...empty,
            fixes: [
                {
                    id: '02RYG',
                    position: Position.latlon('N059.21.23.579', 'E010.52.14.581'),
                },
            ],
        });
    });

    it('read AIRPORTs', function () {
        expect(
            parseSct('[AIRPORT]\nENGM 123.456 N060.12.10.000 E011.05.02.000 D ; test comment')
        ).to.deep.equal({
            ...empty,
            airports: [
                {
                    id: 'ENGM',
                    frequency: '123.456',
                    position: Position.latlon('N060.12.10.000', 'E011.05.02.000'),
                    airportClass: 'D',
                },
            ],
        });
    });

    it('read RUNWAYs', function () {
        expect(
            parseSct(
                '[RUNWAY]\n01L 19R 013 193 N060.11.06.000 E011.04.25.478 N060.12.57.841 E011.05.29.990 ENGM ; test comment'
            )
        ).to.deep.equal({
            ...empty,
            runways: [
                {
                    id: '01L',
                    oppositeId: '19R',
                    heading: 13,
                    oppositeHeading: 193,
                    start: Position.latlon('N060.11.06.000', 'E011.04.25.478'),
                    end: Position.latlon('N060.12.57.841', 'E011.05.29.990'),
                    icao: 'ENGM',
                    airportName: '',
                },
            ],
        });
    });

    it('read ARTCCs', function () {
        expect(
            parseSct(`
[ARTCC]
TMA - Upper Limit - ENCN, Kjevik         N058.43.57.000 E008.34.38.000 N058.41.45.000 E008.38.44.000
                                         N058.41.45.000 E008.38.44.000 N058.28.37.000 E009.02.52.000 ; test comment
                                         N058.28.37.000 E009.02.52.000 N058.24.22.000 E009.10.35.000
        `)
        ).to.eql({
            ...empty,
            artcc: [
                {
                    id: 'TMA - Upper Limit - ENCN, Kjevik',
                    segments: [
                        {
                            start: Position.latlon('N058.43.57.000', 'E008.34.38.000'),
                            end: Position.latlon('N058.41.45.000', 'E008.38.44.000'),
                            color: null,
                        },
                        {
                            start: Position.latlon('N058.41.45.000', 'E008.38.44.000'),
                            end: Position.latlon('N058.28.37.000', 'E009.02.52.000'),
                            color: null,
                        },
                        {
                            start: Position.latlon('N058.28.37.000', 'E009.02.52.000'),
                            end: Position.latlon('N058.24.22.000', 'E009.10.35.000'),
                            color: null,
                        },
                    ],
                },
            ],
        });
    });

    it('read ARTCC HIGHs', function () {
        expect(
            parseSct(`
[ARTCC HIGH]
Sector Border - BIRD | BIRD_N            N065.45.00.000 E000.00.00.000 N066.45.00.000 W010.00.00.000 ; test comment
                                         N066.45.00.000 W010.00.00.000 N066.45.00.000 W011.00.00.000
                                         N066.45.00.000 W011.00.00.000 N066.45.00.000 W015.10.36.000
        `)
        ).to.eql({
            ...empty,
            artccHigh: [
                {
                    id: 'Sector Border - BIRD | BIRD_N',
                    segments: [
                        {
                            color: null,
                            start: Position.latlon('N065.45.00.000', 'E000.00.00.000'),
                            end: Position.latlon('N066.45.00.000', 'W010.00.00.000'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N066.45.00.000', 'W010.00.00.000'),
                            end: Position.latlon('N066.45.00.000', 'W011.00.00.000'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N066.45.00.000', 'W011.00.00.000'),
                            end: Position.latlon('N066.45.00.000', 'W015.10.36.000'),
                        },
                    ],
                },
            ],
        });
    });

    it('read ARTCC LOWs (with color)', function () {
        const color = Color.withNameAndValue('COLOR_TWR-CTR', 13158600);
        expect(
            parseSct(`
#define COLOR_TWR-CTR   13158600
[ARTCC LOW]
CTR - ENNA                               N070.20.00.000 E024.40.00.000 N070.20.00.000 E025.20.00.000 COLOR_TWR-CTR  ; test comment
                                         N070.20.00.000 E025.20.00.000 N069.45.00.000 E025.20.00.000 COLOR_TWR-CTR
                                         N069.45.00.000 E025.20.00.000 N069.45.00.000 E024.40.00.000 COLOR_TWR-CTR
                                         N069.45.00.000 E024.40.00.000 N070.20.00.000 E024.40.00.000 COLOR_TWR-CTR
        `)
        ).to.eql({
            ...empty,
            defines: {
                'color_twr-ctr': Color.withNameAndValue('COLOR_TWR-CTR', 13158600),
            },
            artccLow: [
                {
                    id: 'CTR - ENNA',
                    segments: [
                        {
                            color,
                            start: Position.latlon('N070.20.00.000', 'E024.40.00.000'),
                            end: Position.latlon('N070.20.00.000', 'E025.20.00.000'),
                        },
                        {
                            color,
                            start: Position.latlon('N070.20.00.000', 'E025.20.00.000'),
                            end: Position.latlon('N069.45.00.000', 'E025.20.00.000'),
                        },
                        {
                            color,
                            start: Position.latlon('N069.45.00.000', 'E025.20.00.000'),
                            end: Position.latlon('N069.45.00.000', 'E024.40.00.000'),
                        },
                        {
                            color,
                            start: Position.latlon('N069.45.00.000', 'E024.40.00.000'),
                            end: Position.latlon('N070.20.00.000', 'E024.40.00.000'),
                        },
                    ],
                },
            ],
        });
    });

    it('read high airway', function () {
        expect(
            parseSct(`
[HIGH AIRWAY]
A494       N056.34.58.000 E030.40.27.001 N056.36.03.999 E030.24.50.000 ; test comment
A494       N056.41.27.999 E029.00.56.998 N056.45.06.001 E027.54.06.001; test comment
A494       N056.36.03.999 E030.24.50.000 N056.41.27.999 E029.00.56.998
A494       N056.33.11.001 E031.04.33.999 N056.34.58.000 E030.40.27.001
        `)
        ).to.eql({
            ...empty,
            highAirway: [
                {
                    id: 'A494',
                    segments: [
                        {
                            color: null,
                            start: Position.latlon('N056.34.58.000', 'E030.40.27.001'),
                            end: Position.latlon('N056.36.03.999', 'E030.24.50.000'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N056.41.27.999', 'E029.00.56.998'),
                            end: Position.latlon('N056.45.06.001', 'E027.54.06.001'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N056.36.03.999', 'E030.24.50.000'),
                            end: Position.latlon('N056.41.27.999', 'E029.00.56.998'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N056.33.11.001', 'E031.04.33.999'),
                            end: Position.latlon('N056.34.58.000', 'E030.40.27.001'),
                        },
                    ],
                },
            ],
        });
    });

    it('read low airway', function () {
        expect(
            parseSct(`
[LOW AIRWAY]
A74        N069.08.30.001 E030.39.11.998 N068.37.00.001 E031.46.48.000 ; test comment
A74        N069.25.18.998 E030.01.40.000 N069.08.30.001 E030.39.11.998
        `)
        ).to.eql({
            ...empty,
            lowAirway: [
                {
                    id: 'A74',
                    segments: [
                        {
                            color: null,
                            start: Position.latlon('N069.08.30.001', 'E030.39.11.998'),
                            end: Position.latlon('N068.37.00.001', 'E031.46.48.000'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N069.25.18.998', 'E030.01.40.000'),
                            end: Position.latlon('N069.08.30.001', 'E030.39.11.998'),
                        },
                    ],
                },
            ],
        });
    });

    it('read SID with coordinates', function () {
        expect(
            parseSct(`
[SID]
ENGM SID VIPPA VEMIN5A                   N060.13.50.001 E010.47.04.999 N060.09.51.001 E010.35.54.999
                                         N060.09.51.001 E010.35.54.999 N059.35.19.111 E010.23.59.460
                                         N059.35.19.111 E010.23.59.460 N059.10.08.799 E010.15.33.361 ; test comment
                                         N059.10.08.799 E010.15.33.361 N058.56.33.000 E010.13.42.999; test comment
        `)
        ).to.eql({
            ...empty,
            sid: [
                {
                    id: 'ENGM SID VIPPA VEMIN5A',
                    segments: [
                        {
                            color: null,
                            start: Position.latlon('N060.13.50.001', 'E010.47.04.999'),
                            end: Position.latlon('N060.09.51.001', 'E010.35.54.999'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N060.09.51.001', 'E010.35.54.999'),
                            end: Position.latlon('N059.35.19.111', 'E010.23.59.460'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N059.35.19.111', 'E010.23.59.460'),
                            end: Position.latlon('N059.10.08.799', 'E010.15.33.361'),
                        },
                        {
                            color: null,
                            start: Position.latlon('N059.10.08.799', 'E010.15.33.361'),
                            end: Position.latlon('N058.56.33.000', 'E010.13.42.999'),
                        },
                    ],
                },
            ],
        });
    });

    it('read SID with navaids', function () {
        const SKG = {
            id: 'SKG',
            frequency: '112.800',
            position: Position.latlon('N068.34.42.070', 'E015.02.05.729'),
        };
        const AND = {
            id: 'AND',
            frequency: '112.200',
            position: Position.latlon('N069.17.16.180', 'E016.08.28.971'),
        };
        const GILGU = {
            id: 'GILGU',
            position: Position.latlon('N069.29.38.630', 'E017.30.23.749'),
        };

        expect(
            parseSct(`
[VOR]
SKG  112.800 N068.34.42.070 E015.02.05.729
AND  112.200 N069.17.16.180 E016.08.28.971 ; A comment

[FIXES]
GILGU N069.29.38.630 E017.30.23.749

[SID]
0 FSS ENTC ALT Route                     SKG            SKG            AND            AND           
                                         AND            AND            GILGU          GILGU
        `)
        ).to.eql({
            ...empty,
            vor: [SKG, AND],
            fixes: [GILGU],
            sid: [
                {
                    id: '0 FSS ENTC ALT Route',
                    segments: [
                        {
                            color: null,
                            start: SKG,
                            end: AND,
                        },
                        {
                            color: null,
                            start: AND,
                            end: GILGU,
                        },
                    ],
                },
            ],
        });
    });

    it('read STAR', function () {
        const color = Color.withNameAndValue('COLOR_APP', 13158600);
        expect(
            parseSct(`
#define COLOR_APP       13158600 

[STAR]
ENAL VORDME06                            N062.21.47.041 E005.47.59.690 N062.28.04.418 E005.41.28.359 COLOR_APP ; test comment
                                         N062.28.04.418 E005.41.28.359 N062.31.16.590 E005.40.11.240 COLOR_APP
        `)
        ).to.eql({
            ...empty,
            defines: {
                color_app: color,
            },
            star: [
                {
                    id: 'ENAL VORDME06',
                    segments: [
                        {
                            color,
                            start: Position.latlon('N062.21.47.041', 'E005.47.59.690'),
                            end: Position.latlon('N062.28.04.418', 'E005.41.28.359'),
                        },
                        {
                            color,
                            start: Position.latlon('N062.28.04.418', 'E005.41.28.359'),
                            end: Position.latlon('N062.31.16.590', 'E005.40.11.240'),
                        },
                    ],
                },
            ],
        });
    });

    it('read GEO', function () {
        const stopbar = Color.withNameAndValue('COLOR_Stopbar', 217);
        const taxiway = Color.withNameAndValue('COLOR_Taxiway', 65280);

        expect(
            parseSct(`
#define COLOR_Stopbar        217
#define COLOR_Taxiway      65280

[GEO]
ENCN Region                              N058.11.53.264 E008.04.26.812 N058.11.53.515 E008.04.28.153 COLOR_Stopbar  ; test comment
                                         N058.12.15.241 E008.05.00.642 N058.12.15.883 E008.05.01.485 COLOR_Stopbar; test comment
                                         N058.12.19.720 E008.05.06.676 N058.12.20.118 E008.05.06.563 COLOR_Stopbar   ; test comment
                                         N058.11.51.130 E008.04.35.435 N058.11.49.780 E008.04.33.652 COLOR_Taxiway
                                         N058.11.49.780 E008.04.33.652 N058.11.49.640 E008.04.33.396 COLOR_Taxiway
                                         N058.11.49.640 E008.04.33.396 N058.11.49.535 E008.04.33.143 COLOR_Taxiway
        `)
        ).to.eql({
            ...empty,
            defines: {
                color_stopbar: stopbar,
                color_taxiway: taxiway,
            },
            geo: [
                {
                    id: 'ENCN Region',
                    segments: [
                        {
                            color: stopbar,
                            start: Position.latlon('N058.11.53.264', 'E008.04.26.812'),
                            end: Position.latlon('N058.11.53.515', 'E008.04.28.153'),
                        },
                        {
                            color: stopbar,
                            start: Position.latlon('N058.12.15.241', 'E008.05.00.642'),
                            end: Position.latlon('N058.12.15.883', 'E008.05.01.485'),
                        },
                        {
                            color: stopbar,
                            start: Position.latlon('N058.12.19.720', 'E008.05.06.676'),
                            end: Position.latlon('N058.12.20.118', 'E008.05.06.563'),
                        },
                        {
                            color: taxiway,
                            start: Position.latlon('N058.11.51.130', 'E008.04.35.435'),
                            end: Position.latlon('N058.11.49.780', 'E008.04.33.652'),
                        },
                        {
                            color: taxiway,
                            start: Position.latlon('N058.11.49.780', 'E008.04.33.652'),
                            end: Position.latlon('N058.11.49.640', 'E008.04.33.396'),
                        },
                        {
                            color: taxiway,
                            start: Position.latlon('N058.11.49.640', 'E008.04.33.396'),
                            end: Position.latlon('N058.11.49.535', 'E008.04.33.143'),
                        },
                    ],
                },
            ],
        });
    });

    it('read REGIONS', function () {
        const color = Color.withNameAndValue('COLOR_Building', 3881787);
        expect(
            parseSct(`
#define COLOR_Building   3881787
[REGIONS]
REGIONNAME ENAT ; test comment
COLOR_Building             N069.58.40.755 E023.21.13.825 ; test comment
                           N069.58.40.262 E023.21.12.939; another test comment
                           N069.58.39.718 E023.21.15.557    ; third test comment
                           N069.58.40.215 E023.21.16.432
REGIONNAME ENAT
COLOR_Building             N069.58.40.092 E023.21.16.898
                           N069.58.39.705 E023.21.16.190
                           N069.58.39.344 E023.21.17.850
                           N069.58.39.746 E023.21.18.527
        `)
        ).to.eql({
            ...empty,
            defines: {
                color_building: color,
            },
            regions: [
                {
                    id: 'ENAT',
                    polygons: [
                        {
                            color,
                            points: [
                                Position.latlon('N069.58.40.755', 'E023.21.13.825'),
                                Position.latlon('N069.58.40.262', 'E023.21.12.939'),
                                Position.latlon('N069.58.39.718', 'E023.21.15.557'),
                                Position.latlon('N069.58.40.215', 'E023.21.16.432'),
                            ],
                        },
                        {
                            color,
                            points: [
                                Position.latlon('N069.58.40.092', 'E023.21.16.898'),
                                Position.latlon('N069.58.39.705', 'E023.21.16.190'),
                                Position.latlon('N069.58.39.344', 'E023.21.17.850'),
                                Position.latlon('N069.58.39.746', 'E023.21.18.527'),
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it('read LABELs', function () {
        const color = Color.withNameAndValue('COLOR_Labels', 0);
        expect(
            parseSct(`
#define COLOR_Labels           0

[LABELS]
"4" N060.48.45.154 E005.16.46.230 COLOR_Labels
        `)
        ).to.eql({
            ...empty,
            defines: {
                color_labels: color,
            },
            labels: [
                {
                    text: '"4"',
                    position: Position.latlon('N060.48.45.154', 'E005.16.46.230'),
                    color,
                },
            ],
        });
    });
});
