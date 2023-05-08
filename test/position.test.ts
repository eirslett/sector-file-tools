import chai, { expect } from 'chai';
import chaiAlmost from 'chai-almost';
import { Position } from '../src';

chai.use(chaiAlmost());

describe('Position', function () {
    it('Create position fron latitude and longitude', function () {
        const position = Position.latlon('N057.06.14.158', 'E009.59.34.108');
        /*
        expect(position.lat).to.eql('N057.06.14.158');
        expect(position.lon).to.eql('E009.59.34.108');
         */
    });

    it('convert to UTM', function () {
        expect(Position.latlon('N000.00.00.000', 'E000.00.00.000').toUTM()).to.almost.eql([0, 0]);
    });

    it('convert to WGS84', function () {
        expect(Position.latlon('N000.00.00.000', 'E000.00.00.000').toWGS84()).to.eql([0.0, 0.0]);
    });
});
