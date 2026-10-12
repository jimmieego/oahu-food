import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { parseShortlist } from '../parse.js';
import { findRanges, foldText, makeSearchEntries, parseQuery, searchPlace } from '../search.js';

const FIXTURE = `# Test shortlist

## North Shore

### Haleʻiwa Joe’s

- **Address:** 66-011 Kamehameha Highway, Haleʻiwa, HI 96712.
- **Coordinates:** 21.59300, -158.10300
- **Approximate travel time:** 45–60 minutes driving.
- **Food to consider:** Coconut shrimp and prime rib.
- **Good to know:** Closes at 3 pm on Sundays. Expect a wait at sunset.
- **Sources:** [Official website](https://example.com)

## Waikīkī

### Ramen Place

- **Food to consider:** Tonkotsu ramen.
- Cash only.
`;

const shortlist = parseShortlist(FIXTURE);
const [joes, ramen] = shortlist.places;
const joesEntries = makeSearchEntries(joes, shortlist.sections[0].name);
const ramenEntries = makeSearchEntries(ramen, shortlist.sections[1].name);

describe('foldText', () => {
    it('removes accents and the okina, and maps back to the original text', () => {
        const { folded, starts, ends } = foldText('Haleʻiwa Waikīkī');
        assert.equal(folded, 'haleiwa waikiki');
        assert.equal(folded.length, starts.length);
        assert.equal(ends[ends.length - 1], 'Haleʻiwa Waikīkī'.length);
    });
});

describe('parseQuery', () => {
    const cases = [
        ['  Poke  ', ['poke']],
        ['Haleʻiwa', ['haleiwa']],
        ['WAIKĪKĪ ramen ramen', ['waikiki', 'ramen']],
        ['', []],
        ['   ', []],
    ];
    for (const [input, expected] of cases) {
        it(`reads ${JSON.stringify(input)}`, () => {
            assert.deepEqual(parseQuery(input), expected);
        });
    }
});

describe('makeSearchEntries', () => {
    it('skips the coordinates and the sources', () => {
        const texts = joesEntries.map((entry) => entry.text).join(' ');
        assert.doesNotMatch(texts, /21\.593|Official website/);
    });

    it('marks the name, the area, and the first food field as visible', () => {
        const visible = joesEntries.filter((entry) => entry.isVisible).map((entry) => entry.kind);
        assert.deepEqual(visible, ['name', 'area', 'food']);
    });

    it('includes the notes', () => {
        assert.ok(ramenEntries.some((entry) => entry.kind === 'note' && entry.text === 'Cash only.'));
    });
});

describe('searchPlace', () => {
    it('matches every place when the query is empty', () => {
        assert.deepEqual(searchPlace(joesEntries, []), { isMatch: true, snippet: null });
    });

    it('matches without accents or the okina', () => {
        assert.equal(searchPlace(joesEntries, parseQuery('haleiwa')).isMatch, true);
        assert.equal(searchPlace(ramenEntries, parseQuery('Waikiki')).isMatch, true);
    });

    it('matches the start of a word only', () => {
        assert.equal(searchPlace(joesEntries, parseQuery('shri')).isMatch, true);
        assert.equal(searchPlace(joesEntries, parseQuery('rimp')).isMatch, false);
        assert.equal(searchPlace(joesEntries, parseQuery('rib')).isMatch, true);
        assert.equal(searchPlace(joesEntries, parseQuery('ice')).isMatch, false);
    });

    it('requires every word to match', () => {
        assert.equal(searchPlace(joesEntries, parseQuery('shrimp sunset')).isMatch, true);
        assert.equal(searchPlace(joesEntries, parseQuery('shrimp ramen')).isMatch, false);
    });

    it('gives no snippet when the match is already visible', () => {
        assert.equal(searchPlace(joesEntries, parseQuery('shrimp')).snippet, null);
        assert.equal(searchPlace(ramenEntries, parseQuery('waikiki')).snippet, null);
    });

    it('gives a snippet when the match is only in the details', () => {
        assert.deepEqual(searchPlace(joesEntries, parseQuery('sunday')).snippet, {
            label: 'Good to know',
            text: 'Closes at 3 pm on Sundays. Expect a wait at sunset.',
        });
        assert.deepEqual(searchPlace(ramenEntries, parseQuery('cash')).snippet, { label: '', text: 'Cash only.' });
    });

    it('shortens a long snippet at word boundaries', () => {
        const place = {
            name: 'Long Notes',
            fields: [{ label: 'Good to know', role: 'note', value: `${'word '.repeat(30)}target ${'tail '.repeat(30)}` }],
            notes: [],
        };
        const { snippet } = searchPlace(makeSearchEntries(place, 'Area'), ['target']);
        assert.match(snippet.text, /^…word .*target .*tail…$/);
        assert.ok(snippet.text.length < 120);
    });
});

describe('findRanges', () => {
    it('finds each word and merges ranges that overlap', () => {
        assert.deepEqual(findRanges('Coconut shrimp', ['coco', 'coconut', 'shrimp']), [
            [0, 7],
            [8, 14],
        ]);
    });

    it('skips matches inside a word', () => {
        assert.deepEqual(findRanges('Fried rice and shave ice', ['ice']), [[21, 24]]);
    });

    it('returns ranges in the original text', () => {
        const text = 'Haleʻiwa Joe’s';
        const [[start, end]] = findRanges(text, parseQuery('haleiwa'));
        assert.equal(text.slice(start, end), 'Haleʻiwa');
    });

    it('returns no ranges for an empty query', () => {
        assert.deepEqual(findRanges('Poke', []), []);
    });
});

describe('restaurants.md', () => {
    it('finds poke places in the real list', async () => {
        const real = parseShortlist(await readFile(new URL('../restaurants.md', import.meta.url), 'utf8'));
        const terms = parseQuery('poke');
        const matches = real.sections.flatMap((section) =>
            section.places.filter((place) => searchPlace(makeSearchEntries(place, section.name), terms).isMatch)
        );
        assert.ok(matches.length > 0);
    });
});
