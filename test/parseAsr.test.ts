import { expect } from 'chai';
import { ASR, parseAsr, Position } from '../src';

const empty: ASR = {
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

describe('parse ASR', function () {
    it('can parse empty string', function () {
        expect(parseAsr('')).to.deep.equal(empty);
    });

    it('can parse sectorfile name', function () {
        expect(parseAsr('SECTORFILE:foo')).to.deep.equal({
            ...empty,
            sectorFile: 'foo',
        });
    });

    it('can parse title', function () {
        expect(parseAsr('SECTORTITLE:bar')).to.deep.equal({
            ...empty,
            sectorTitle: 'bar',
        });
    });

    it('can parse ARTCC', function () {
        expect(parseAsr('ARTCC boundary:Delegated Airspace - NORLI (ENBD -> ESOS):')).to.deep.equal(
            {
                ...empty,
                artcc: ['Delegated Airspace - NORLI (ENBD -> ESOS)'],
            }
        );
    });

    it('can parse ARTCC high boundary', function () {
        expect(parseAsr('ARTCC high boundary:Sector - AOR - ENBD:')).to.deep.equal({
            ...empty,
            artccHigh: ['Sector - AOR - ENBD'],
        });
    });

    it('can parse ARTCC low boundary', function () {
        expect(parseAsr('ARTCC low boundary:CTR - ENDU:')).to.deep.equal({
            ...empty,
            artccLow: ['CTR - ENDU'],
        });
    });

    it('can parse freetext', function () {
        expect(parseAsr('Free Text:ENBR Parking\\PAD 2:freetext')).to.deep.equal({
            ...empty,
            freetext: {
                'ENBR Parking': ['PAD 2'],
            },
        });
    });

    it('can parse GEO', function () {
        expect(parseAsr('Geo:ENTO Region:')).to.deep.equal({
            ...empty,
            geo: ['ENTO Region'],
        });
    });

    it('can parse Regions', function () {
        expect(parseAsr('Regions:ENAL:polygon')).to.deep.equal({
            ...empty,
            regions: ['ENAL'],
        });
    });

    // TODO: find an example ASR file with STAR, VOR and NDB in it
    /*
    it('can parse STARs', function () {
        expect(parseAsr('')).to.deep.equal({
            ...empty
        });
    });

    it('can parse VORs', function () {
        expect(parseAsr('')).to.deep.equal({
            ...empty
        });
    });

    it('can parse NDBs', function () {
        expect(parseAsr('')).to.deep.equal({
            ...empty
        });
    });
     */

    it('can parse FIXES', function () {
        expect(parseAsr('Fixes:TEKVA:symbol')).to.deep.equal({
            ...empty,
            fixes: ['TEKVA'],
        });
    });

    it('can parse runways', function () {
        expect(
            parseAsr(`
Runways:ENBR Flesland 17-35:extended centerline 1
Runways:ENBR Flesland 17-35:extended centerline 1 left ticks
Runways:ENBR Flesland 17-35:extended centerline 1 right ticks
Runways:ENBR Flesland 17-35:extended centerline 2
Runways:ENBR Flesland 17-35:extended centerline 2 left ticks
Runways:ENBR Flesland 17-35:extended centerline 2 right ticks
        `)
        ).to.deep.equal({
            ...empty,
            runways: {
                'ENBR Flesland 17-35': [
                    'extended centerline 1',
                    'extended centerline 1 left ticks',
                    'extended centerline 1 right ticks',
                    'extended centerline 2',
                    'extended centerline 2 left ticks',
                    'extended centerline 2 right ticks',
                ],
            },
        });
    });

    it('can parse WINDOWAREA', function () {
        expect(parseAsr('WINDOWAREA:60.168790:11.004299:60.225587:11.197037')).to.deep.equal({
            ...empty,
            viewport: [
                Position.latlonFloat(60.16879, 11.004299),
                Position.latlonFloat(60.225587, 11.197037),
            ],
        });
    });
});
