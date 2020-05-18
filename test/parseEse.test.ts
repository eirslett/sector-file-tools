import { expect } from 'chai';
import { ESE, parseEse, Position } from "../src";

const empty: ESE = {
    freetext: {},
    positions: []
};

describe('parse ESE', function () {
    it('can parse empty string', function() {
        expect(parseEse('')).to.deep.equal(empty);
    });

    it('skips empty lines', function() {
        expect(parseEse('\n\n\n')).to.deep.equal(empty);
    });

    it('skips comments', function() {
        expect(parseEse(';comment\n\n\n')).to.deep.equal(empty);
    });

    it('read FREETEXTs', function () {
        expect(parseEse(`
[FREETEXT]
N062.33.29.800:E006.06.41.540:ENAL Parking:10
N062.33.30.490:E006.06.44.700:ENAL Parking:11
N062.33.42.900:E006.07.13.408:ENAL Taxiways:A
        `)).to.eql({
            ...empty,
            freetext: {
                'ENAL Parking': [{
                    text: '10',
                    position: Position.latlon('N062.33.29.800', 'E006.06.41.540'),
                    color: null
                }, {
                    text: '11',
                    position: Position.latlon('N062.33.30.490', 'E006.06.44.700'),
                    color: null
                }],
                'ENAL Taxiways': [{
                    text: 'A',
                    position: Position.latlon('N062.33.42.900', 'E006.07.13.408'),
                    color: null
                }]
            }
        });
    });

    it('read POSITIONs', function () {
       expect(parseEse(`
[POSITIONS]
ENZV_APP:Sola Approach:119.600:ZAR::ENZV:APP:::1001:7477:N058.52.36.000:E005.38.16.000
       `)).to.eql({
           ...empty,
           positions: [{
               name: 'ENZV_APP',
               prefix: 'ENZV',
               suffix: 'APP',
               radioCallsign: 'Sola Approach',
               frequency: '119.600',
               identifier: 'ZAR',
               middleLetter: '',
               startRange: 1001,
               endRange: 7477,
               centers: [
                   Position.latlon('N058.52.36.000', 'E005.38.16.000')
               ]
           }]
       });
    });
});
