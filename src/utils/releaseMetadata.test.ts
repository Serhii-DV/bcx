import { describe, expect, it } from '@rstest/core';
import { parseReleaseMetadata } from './releaseMetadata';

describe('parseReleaseMetadata', () => {
  it('parses artist, title, type and year from parentheses', () => {
    expect(
      parseReleaseMetadata('Primitive Outtakes - Schwarzmondnacht (EP 2023)'),
    ).toEqual({
      artistNames: ['Primitive Outtakes'],
      releaseTitle: 'Schwarzmondnacht',
      releaseType: 'EP',
      releaseYear: 2023,
    });
  });

  it('parses album type from parentheses and year at end', () => {
    expect(
      parseReleaseMetadata(
        'Primitive Outtakes - Jenseits von Eden (Album) 2018',
      ),
    ).toEqual({
      artistNames: ['Primitive Outtakes'],
      releaseTitle: 'Jenseits von Eden',
      releaseType: 'Album',
      releaseYear: 2018,
    });
  });

  it('parses demo type and year without parentheses', () => {
    expect(
      parseReleaseMetadata('Primitive Outtakes - Die Zähmung Demo 2016'),
    ).toEqual({
      artistNames: ['Primitive Outtakes'],
      releaseTitle: 'Die Zähmung',
      releaseType: 'Demo',
      releaseYear: 2016,
    });
  });

  it('parses year in middle plus type in parentheses', () => {
    expect(parseReleaseMetadata('Krigsgravene - 2017 - Homage (EP)')).toEqual({
      artistNames: ['Krigsgravene'],
      releaseTitle: 'Homage',
      releaseType: 'EP',
      releaseYear: 2017,
    });
  });

  it('parses two artists, year in middle and title', () => {
    expect(
      parseReleaseMetadata(
        'Krigsgravene, SchwarzerWagenKnecht - 2016 - Aufbahrung',
      ),
    ).toEqual({
      artistNames: ['Krigsgravene', 'SchwarzerWagenKnecht'],
      releaseTitle: 'Aufbahrung',
      releaseYear: 2016,
    });
  });

  it('leaves title intact and does not parse year from "of 2023" phrase', () => {
    expect(parseReleaseMetadata('Dark Ambient of 2023')).toEqual({
      releaseTitle: 'Dark Ambient of 2023',
    });
  });

  it('parses catalog, artist and title with quote delimiter #1', () => {
    expect(
      parseReleaseMetadata(
        '(ZZS 173) Brotherhood of Sleep "Enter the Nuummite Cosmos',
      ),
    ).toEqual({
      catalogNumber: 'ZZS 173',
      artistNames: ['Brotherhood of Sleep'],
      releaseTitle: 'Enter the Nuummite Cosmos',
    });
  });

  it('parses catalog, multiple artists and title with quote delimiter #2', () => {
    expect(
      parseReleaseMetadata('(ZZS 164) Kemet / Emme Ya "Ashes of Divinity'),
    ).toEqual({
      catalogNumber: 'ZZS 164',
      artistNames: ['Kemet', 'Emme Ya'],
      releaseTitle: 'Ashes of Divinity',
    });
  });

  it('handles values with extra whitespace and mixed case', () => {
    expect(
      parseReleaseMetadata(
        '  primitive outtakes -  Schwarzmondnacht  (ep 2023)  ',
      ),
    ).toEqual({
      artistNames: ['primitive outtakes'],
      releaseTitle: 'Schwarzmondnacht',
      releaseType: 'EP',
      releaseYear: 2023,
    });
  });
});
