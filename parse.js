const ROLE_PATTERNS = [
    ['coordinates', /coordinates|^coords$/i],
    ['address', /^address$/i],
    ['sources', /^(sources?|links?)$/i],
    ['travel', /travel|^drive|^walk/i],
    ['post', /post|reddit|comment/i],
    ['food', /food|dish|order|menu/i],
];

const MODE_WORDS = {
    walking: 'walk',
    walk: 'walk',
    'on foot': 'walk',
    driving: 'drive',
    drive: 'drive',
    'by car': 'drive',
};

const HEADING_PATTERN = /^(#{1,3})\s+(.*?)\s*#*$/;
const FIELD_PATTERN = /^\s*[-*+]\s+\*\*([^*]+?)(?::\*\*|\*\*:)\s*(.*)$/;
const BULLET_PATTERN = /^\s*[-*+]\s+(.*)$/;
const INTRO_FIELD_PATTERN = /^\*\*([^*]+?)(?::\*\*|\*\*:)\s*(.*)$/;
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const INLINE_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*/g;
const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:)/i;
const COORDINATE_PATTERN = /(?<![\d.])(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)(?![\d.])/;
const TRAVEL_PATTERN =
    /(\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?)\s*(minutes?|mins?|hours?|hrs?)\s+(walking|walk|on foot|driving|drive|by car)/gi;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

export function renderInline(markdown) {
    let html = '';
    let lastIndex = 0;
    for (const match of markdown.matchAll(INLINE_PATTERN)) {
        const [whole, linkText, url, strong, emphasis] = match;
        html += escapeHtml(markdown.slice(lastIndex, match.index));
        if (linkText !== undefined) {
            html += SAFE_URL_PATTERN.test(url)
                ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${renderInline(linkText)}</a>`
                : renderInline(linkText);
        } else if (strong !== undefined) {
            html += `<strong>${renderInline(strong)}</strong>`;
        } else {
            html += `<em>${renderInline(emphasis)}</em>`;
        }
        lastIndex = match.index + whole.length;
    }
    return html + escapeHtml(markdown.slice(lastIndex));
}

export function plainText(markdown) {
    return markdown
        .replace(LINK_PATTERN, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*([^*\s][^*]*?)\*/g, '$1');
}

export function extractLinks(markdown) {
    return [...markdown.matchAll(LINK_PATTERN)]
        .filter(([, , url]) => SAFE_URL_PATTERN.test(url))
        .map(([, text, url]) => ({ text: plainText(text), url }));
}

export function parseCoordinates(text) {
    const match = text.match(COORDINATE_PATTERN);
    if (!match) {
        return null;
    }
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        return null;
    }
    return [latitude, longitude];
}

export function summarizeTravel(text) {
    const modes = new Set();
    const summary = [];
    for (const [, amount, unit, modeWord] of text.matchAll(TRAVEL_PATTERN)) {
        const mode = MODE_WORDS[modeWord.toLowerCase()];
        if (modes.has(mode)) {
            continue;
        }
        modes.add(mode);
        const shortUnit = /^h/i.test(unit) ? 'hr' : 'min';
        const duration = `${amount.replace(/\s*[–-]\s*/, '–')} ${shortUnit}`;
        summary.push({ mode, duration, text: `${duration} ${mode}` });
    }
    return summary;
}

function roleFor(label) {
    const entry = ROLE_PATTERNS.find(([, pattern]) => pattern.test(label));
    return entry ? entry[0] : 'note';
}

function finishPlace(place) {
    const valueFor = (role) => place.fields.find((field) => field.role === role)?.value ?? '';
    return {
        ...place,
        coordinates: parseCoordinates(valueFor('coordinates')),
        address: plainText(valueFor('address')).replace(/\.$/, ''),
        links: place.fields
            .filter((field) => field.role === 'sources')
            .flatMap((field) => extractLinks(field.value)),
        travel: summarizeTravel(plainText(valueFor('travel'))),
    };
}

export function parseShortlist(markdown) {
    const shortlist = {
        title: '',
        intro: [],
        start: { name: '', coordinates: null },
        sections: [],
    };
    let section = null;
    let place = null;
    let field = null;
    let paragraph = [];

    const flushParagraph = () => {
        if (paragraph.length === 0) {
            return;
        }
        const target = place?.notes ?? section?.intro ?? shortlist.intro;
        target.push(paragraph.join(' '));
        paragraph = [];
    };

    const lines = markdown.replace(COMMENT_PATTERN, '').replace(/\r\n?/g, '\n').split('\n');
    for (const rawLine of lines) {
        const line = rawLine.trim();
        const heading = line.match(HEADING_PATTERN);
        if (heading) {
            flushParagraph();
            field = null;
            const [, hashes, text] = heading;
            if (hashes.length === 1) {
                shortlist.title = text;
            } else if (hashes.length === 2) {
                section = { name: text, index: shortlist.sections.length, intro: [], places: [] };
                shortlist.sections.push(section);
                place = null;
            } else {
                if (!section) {
                    section = { name: 'Places', index: 0, intro: [], places: [] };
                    shortlist.sections.push(section);
                }
                place = {
                    name: text.replace(/^\d+[.)]\s+/, ''),
                    sectionIndex: section.index,
                    fields: [],
                    notes: [],
                };
                section.places.push(place);
            }
            continue;
        }

        if (line === '') {
            flushParagraph();
            field = null;
            continue;
        }

        if (place) {
            const fieldMatch = rawLine.match(FIELD_PATTERN);
            if (fieldMatch) {
                flushParagraph();
                const label = fieldMatch[1].trim();
                field = { label, value: fieldMatch[2].trim(), role: roleFor(label) };
                place.fields.push(field);
                continue;
            }
            const bullet = rawLine.match(BULLET_PATTERN);
            if (bullet) {
                flushParagraph();
                field = null;
                place.notes.push(bullet[1].trim());
                continue;
            }
            if (field && /^\s/.test(rawLine)) {
                field.value += ` ${line}`;
                continue;
            }
        }

        if (!section) {
            const introField = line.match(INTRO_FIELD_PATTERN);
            const introLabel = introField?.[1].trim().toLowerCase();
            if (introLabel === 'starting point coordinates') {
                flushParagraph();
                shortlist.start.coordinates = parseCoordinates(introField[2]);
                continue;
            }
            if (introLabel === 'starting point') {
                shortlist.start.name = plainText(introField[2]).replace(/\.$/, '');
            }
        }

        paragraph.push(line);
    }
    flushParagraph();

    let number = 0;
    for (const currentSection of shortlist.sections) {
        currentSection.places = currentSection.places.map((entry) => {
            number += 1;
            return { ...finishPlace(entry), number, id: `place-${number}` };
        });
    }
    shortlist.places = shortlist.sections.flatMap((currentSection) => currentSection.places);
    return shortlist;
}
