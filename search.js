import { plainText } from './parse.js';

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const IGNORED_CHARACTERS = /[\u02bb\u02bc\u2018\u2019'`]/g;
const SEARCH_ROLES = new Set(['coordinates', 'sources']);
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const SNIPPET_BEFORE = 36;
const SNIPPET_AFTER = 64;

function foldCharacter(character) {
    return character.normalize('NFD').replace(COMBINING_MARKS, '').replace(IGNORED_CHARACTERS, '').toLowerCase();
}

export function foldText(text) {
    let folded = '';
    const starts = [];
    const ends = [];
    let index = 0;
    for (const character of text) {
        const piece = foldCharacter(character);
        folded += piece;
        for (let count = 0; count < piece.length; count += 1) {
            starts.push(index);
            ends.push(index + character.length);
        }
        index += character.length;
    }
    return { folded, starts, ends };
}

function indexOfWord(folded, term, from = 0) {
    let at = folded.indexOf(term, from);
    while (at > 0 && WORD_CHARACTER.test(folded[at - 1])) {
        at = folded.indexOf(term, at + 1);
    }
    return at;
}

const hasWord = (folded, term) => indexOfWord(folded, term) !== -1;

export function parseQuery(query) {
    return [...new Set(foldText(query).folded.split(/\s+/).filter(Boolean))];
}

export function makeSearchEntries(place, areaName) {
    const entries = [
        { kind: 'name', label: '', text: plainText(place.name), isVisible: true },
        { kind: 'area', label: '', text: plainText(areaName), isVisible: true },
    ];
    for (const field of place.fields) {
        if (SEARCH_ROLES.has(field.role)) {
            continue;
        }
        const isFood = field.role === 'food' && !entries.some((entry) => entry.kind === 'food');
        entries.push({
            kind: isFood ? 'food' : 'field',
            label: field.label,
            text: plainText(field.value),
            isVisible: isFood,
        });
    }
    for (const note of place.notes) {
        entries.push({ kind: 'note', label: '', text: plainText(note), isVisible: false });
    }
    return entries.map((entry) => ({ ...entry, folded: foldText(entry.text).folded }));
}

export function findRanges(text, terms) {
    const { folded, starts, ends } = foldText(text);
    const ranges = [];
    for (const term of terms) {
        let at = indexOfWord(folded, term);
        while (at !== -1) {
            ranges.push([starts[at], ends[at + term.length - 1]]);
            at = indexOfWord(folded, term, at + term.length);
        }
    }
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) {
        const last = merged[merged.length - 1];
        if (last && range[0] <= last[1]) {
            last[1] = Math.max(last[1], range[1]);
        } else {
            merged.push([...range]);
        }
    }
    return merged;
}

function makeSnippet(entry, term) {
    const { folded, starts, ends } = foldText(entry.text);
    const at = indexOfWord(folded, term);
    const matchStart = starts[at];
    const matchEnd = ends[at + term.length - 1];
    let start = Math.max(0, matchStart - SNIPPET_BEFORE);
    let end = Math.min(entry.text.length, matchEnd + SNIPPET_AFTER);
    if (start > 0) {
        const space = entry.text.indexOf(' ', start);
        start = space !== -1 && space < matchStart ? space + 1 : start;
    }
    if (end < entry.text.length) {
        const space = entry.text.lastIndexOf(' ', end);
        end = space > matchEnd ? space : end;
    }
    const excerpt = entry.text.slice(start, end).trim();
    return {
        label: entry.label,
        text: `${start > 0 ? '…' : ''}${excerpt}${end < entry.text.length ? '…' : ''}`,
    };
}

export function searchPlace(entries, terms) {
    if (terms.length === 0) {
        return { isMatch: true, snippet: null };
    }
    const isMatch = terms.every((term) => entries.some((entry) => hasWord(entry.folded, term)));
    if (!isMatch) {
        return { isMatch: false, snippet: null };
    }
    const hiddenTerm = terms.find(
        (term) => !entries.some((entry) => entry.isVisible && hasWord(entry.folded, term))
    );
    const entry = hiddenTerm && entries.find((item) => !item.isVisible && hasWord(item.folded, hiddenTerm));
    return { isMatch: true, snippet: entry ? makeSnippet(entry, hiddenTerm) : null };
}
