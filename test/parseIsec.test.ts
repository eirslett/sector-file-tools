import { expect } from 'chai';
import { SCT, parseSct, Position, Color } from '../src';
import parseIsec from '../src/parseIsec';

describe('Parse ISEC-file', function () {
    it('can parse empty string', function () {
        expect(parseIsec('')).to.deep.equal([]);
    });

    it('skips empty lines', function () {
        expect(parseIsec('\n\n\n')).to.deep.equal([]);
    });

    it('skips comments', function () {
        expect(parseIsec(';comment\n\n\n')).to.deep.equal([]);
    });

    it('Read navaids', function () {
        expect(
            parseIsec(`
                ;------------------------------------------------------
                ; SOME  HEADER   TEXT !
                ;------------------------------------------------------
                ATLAP	 60.146094	   9.800694	15
                GM402	 60.130306	  10.252833	15
                OGRAS	 59.993703	  10.964169	15
            `)
        ).to.deep.equal([
            { id: 'ATLAP', position: Position.latlonFloat(60.146094, 9.800694) },
            { id: 'GM402', position: Position.latlonFloat(60.130306, 10.252833) },
            { id: 'OGRAS', position: Position.latlonFloat(59.993703, 10.964169) },
        ]);
    });
});
