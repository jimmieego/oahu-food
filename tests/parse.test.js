import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
    extractLinks,
    parseCoordinates,
    parseShortlist,
    plainText,
    renderInline,
    summarizeTravel,
} from '../parse.js';

const FIXTURE = `# Test shortlist

**Starting point:** Test Hotel, 1 Beach Road, Honolulu, HI 96815.

**Starting point coordinates:** 21.30000, -157.80000

Travel times are estimates.

## West side

### 1. First Place

- **Address:** 10 Main Street, Kapolei, HI 96707.
- **Coordinates:** 21.34, -158.12
- **Approximate travel time:** 5–10 minutes walking, or 2–5 minutes driving.
- **Food to consider:** Pizza.
- **Post recommendation:** The poster loved it
  and went back twice.
- **Sources:** [Official page](https://example.com/first) · [Bad link](javascript:alert(1))

## Town

Busy at lunch.

### Second Place

- **Address:** 20 Side Street, Honolulu, HI 96815.
- **Finding the shop:** Use the back entrance.
- Cash only.
`;

describe('renderInline', () => {
    it('renders bold, emphasis, and safe links', () => {
        assert.equal(
            renderInline('**Fried rice** and *eggs* at [Cafe](https://example.com)'),
            '<strong>Fried rice</strong> and <em>eggs</em> at <a href="https://example.com" target="_blank" rel="noopener">Cafe</a>'
        );
    });

    it('escapes HTML', () => {
        assert.equal(renderInline('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
    });

    it('renders unsafe links as plain text', () => {
        assert.equal(renderInline('[Click](javascript:alert)'), 'Click');
    });

    it('returns an empty string for empty input', () => {
        assert.equal(renderInline(''), '');
    });
});

describe('plainText', () => {
    it('removes link and emphasis markup', () => {
        assert.equal(plainText('**Bold** [Link](https://example.com) *soft*'), 'Bold Link soft');
    });
});

describe('extractLinks', () => {
    it('keeps only http, mailto, and tel links', () => {
        assert.deepEqual(extractLinks('[A](https://a.test) · [B](javascript:x) · [C](tel:+18085550100)'), [
            { text: 'A', url: 'https://a.test' },
            { text: 'C', url: 'tel:+18085550100' },
        ]);
    });
});

describe('parseCoordinates', () => {
    const cases = [
        ['21.34159, -158.12347', [21.34159, -158.12347]],
        ['21.3,-158.1', [21.3, -158.1]],
        ['https://www.google.com/maps/@21.2768,-157.8279,17z', [21.2768, -157.8279]],
        ['95.1, -158.1', null],
        ['21.3, -190.5', null],
        ['', null],
        ['no numbers here', null],
    ];
    for (const [input, expected] of cases) {
        it(`parses "${input}"`, () => {
            assert.deepEqual(parseCoordinates(input), expected);
        });
    }
});

describe('summarizeTravel', () => {
    const cases = [
        [
            '5–10 minutes walking, or 2–5 minutes driving. The mapped walk is about 0.3 mile and 5 minutes.',
            ['5–10 min walk', '2–5 min drive'],
        ],
        ['25–40 minutes driving. The route showed about 22 minutes and 17 miles.', ['25–40 min drive']],
        ['1-1.5 hours driving', ['1–1.5 hr drive']],
        ['3 minutes driving, or 10 minutes driving with traffic', ['3 min drive']],
        ['About half an hour', []],
        ['', []],
    ];
    for (const [input, expected] of cases) {
        it(`summarizes "${input}"`, () => {
            assert.deepEqual(
                summarizeTravel(input).map((item) => item.text),
                expected
            );
        });
    }
});

describe('parseShortlist', () => {
    const shortlist = parseShortlist(FIXTURE);
    const [first, second] = shortlist.places;

    it('reads the title and the starting point', () => {
        assert.equal(shortlist.title, 'Test shortlist');
        assert.equal(shortlist.start.name, 'Test Hotel, 1 Beach Road, Honolulu, HI 96815');
        assert.deepEqual(shortlist.start.coordinates, [21.3, -157.8]);
    });

    it('keeps intro paragraphs but drops the coordinates line', () => {
        assert.deepEqual(shortlist.intro, [
            '**Starting point:** Test Hotel, 1 Beach Road, Honolulu, HI 96815.',
            'Travel times are estimates.',
        ]);
    });

    it('groups places by area and numbers them across areas', () => {
        assert.deepEqual(
            shortlist.sections.map((section) => [section.name, section.places.map((place) => place.number)]),
            [
                ['West side', [1]],
                ['Town', [2]],
            ]
        );
        assert.deepEqual(shortlist.sections[1].intro, ['Busy at lunch.']);
    });

    it('strips the number from headings', () => {
        assert.equal(first.name, 'First Place');
        assert.equal(first.id, 'place-1');
        assert.equal(second.name, 'Second Place');
        assert.equal(second.id, 'place-2');
    });

    it('assigns roles to fields', () => {
        assert.deepEqual(
            first.fields.map((field) => [field.label, field.role]),
            [
                ['Address', 'address'],
                ['Coordinates', 'coordinates'],
                ['Approximate travel time', 'travel'],
                ['Food to consider', 'food'],
                ['Post recommendation', 'post'],
                ['Sources', 'sources'],
            ]
        );
        assert.equal(second.fields[1].role, 'note');
    });

    it('joins indented continuation lines', () => {
        assert.equal(first.fields[4].value, 'The poster loved it and went back twice.');
    });

    it('derives coordinates, address, links, and travel summary', () => {
        assert.deepEqual(first.coordinates, [21.34, -158.12]);
        assert.equal(first.address, '10 Main Street, Kapolei, HI 96707');
        assert.deepEqual(first.links, [{ text: 'Official page', url: 'https://example.com/first' }]);
        assert.deepEqual(
            first.travel.map((item) => item.text),
            ['5–10 min walk', '2–5 min drive']
        );
    });

    it('handles a place without coordinates and with a plain bullet', () => {
        assert.equal(second.coordinates, null);
        assert.deepEqual(second.links, []);
        assert.deepEqual(second.travel, []);
        assert.deepEqual(second.notes, ['Cash only.']);
    });

    it('ignores HTML comments', () => {
        const parsed = parseShortlist(`${FIXTURE}\n<!--\n### Hidden template\n- **Address:** Nowhere.\n-->\n`);
        assert.equal(parsed.places.length, 2);
    });

    it('handles empty and heading-free input', () => {
        assert.deepEqual(parseShortlist('').places, []);
        const loose = parseShortlist('### Lonely Place\n- **Coordinates:** 21.1, -157.1');
        assert.equal(loose.sections[0].name, 'Places');
        assert.deepEqual(loose.places[0].coordinates, [21.1, -157.1]);
    });

    it('accepts a colon outside the bold label and Windows line endings', () => {
        const parsed = parseShortlist('## Area\r\n### Place\r\n- **Address**: 1 Road.\r\n');
        assert.equal(parsed.places[0].address, '1 Road');
    });
});

describe('restaurants.md', async () => {
    const markdown = await readFile(new URL('../restaurants.md', import.meta.url), 'utf8');
    const shortlist = parseShortlist(markdown);

    it('has a starting point on the map', () => {
        assert.ok(shortlist.start.coordinates, 'Add a "**Starting point coordinates:**" line');
    });

    it('lists at least one restaurant', () => {
        assert.ok(shortlist.places.length > 0);
    });

    for (const place of shortlist.places) {
        it(`has coordinates for ${place.name}`, () => {
            assert.ok(place.coordinates, `Add a "- **Coordinates:**" line under "${place.name}"`);
        });
    }
});
