import { MAP_FLAVORS } from './map-theme.js';
import { escapeHtml, parseShortlist, plainText, renderInline } from './parse.js';
import { findRanges, makeSearchEntries, parseQuery, searchPlace } from './search.js';

const DATA_URL = 'restaurants.md';
const AREA_TONES = ['lagoon', 'ahi', 'ube', 'tileaf', 'lilikoi', 'reef', 'hibiscus', 'koa', 'slate'];
const HIDDEN_FIELD_ROLES = new Set(['coordinates', 'sources']);
const icon = (paths, extraClass = '') =>
    `<svg class="icon${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const ICONS = {
    walk: icon(
        '<circle cx="13.5" cy="4.5" r="2"/><path d="m12.5 8.2-1.5 6M12.5 8.2 9 10.3l-1.4 3.2M12.5 8.6l2 3 2.6 1M11 14.2l2.6 3 .5 3.8M11 14.2l-1.5 3.9L7 21"/>'
    ),
    drive: icon(
        '<path d="M5.5 16.5H4a1 1 0 0 1-1-1v-3.3a2 2 0 0 1 .6-1.4L6 8.5l1.3-2.7A1.5 1.5 0 0 1 8.7 5h6.6a1.5 1.5 0 0 1 1.4.8L18 8.5l2.4 2.3a2 2 0 0 1 .6 1.4v3.3a1 1 0 0 1-1 1h-1.5M9.5 16.5h5M6 8.5h12"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>'
    ),
    chevron: icon('<path d="m6 9.5 6 6 6-6"/>', ' place-chevron'),
    pin: icon('<path d="M12 21s-6.5-5.5-6.5-11a6.5 6.5 0 0 1 13 0c0 5.5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.25"/>'),
    external: icon('<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/>'),
    saving: icon('<path d="M12 4.5v10M7.5 10l4.5 4.5 4.5-4.5M5 19.5h14"/>'),
    ready: icon('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    offline: icon(
        '<path d="M3.5 9.6A12 12 0 0 1 8 7.1M12.6 6.5a12 12 0 0 1 7.9 3.1M7 13.1a7 7 0 0 1 3.4-1.6M15.4 12.1a7 7 0 0 1 1.6 1M12 17.5h.01M4 4l16 16"/>'
    ),
    failed: icon('<circle cx="12" cy="12" r="8.25"/><path d="M12 8v4.5M12 15.75h.01"/>'),
};
const OFFLINE_MESSAGES = {
    saving: ['saving', 'Saving the map for offline use'],
    ready: ['ready', 'Ready to use offline'],
    failed: ['failed', 'Map not saved yet. It saves on your next visit.'],
    offlineSaved: ['offline', 'Offline. You see the saved copy.'],
    offlineMissing: ['offline', 'Offline. The map is not saved on this phone.'],
};
const TILES_URL = 'tiles/oahu.pmtiles';
const TILES_MAX_ZOOM = 15;
const TILE_ATTRIBUTION =
    '<a href="https://protomaps.com">Protomaps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OAHU_BOUNDS = [
    [21.22, -158.32],
    [21.74, -157.62],
];
const HOME_GLYPH =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 3 11.2h2.6V20h4.8v-5.6h3.2V20h4.8v-8.8H21z"/></svg>';
const DETAIL_ZOOM = 16;
const PIN_SIZE = 28;
const CLUSTER_SIZE = 36;
const CLUSTER_HOME_WIDTH = 18;
const STATUS_DURATION_MS = 6000;
const SEARCH_ANNOUNCE_DELAY_MS = 700;
const MAP_RESIZE_MS = 360;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

const root = document.documentElement;
const elements = {
    masthead: document.querySelector('.masthead'),
    title: document.getElementById('title'),
    meta: document.getElementById('meta'),
    count: document.getElementById('count'),
    offlineStatus: document.getElementById('offline-status'),
    about: document.getElementById('about'),
    aboutBody: document.getElementById('about-body'),
    mapFrame: document.getElementById('map-frame'),
    map: document.getElementById('map'),
    showAll: document.getElementById('show-all'),
    locate: document.getElementById('locate'),
    mapSize: document.getElementById('map-size'),
    mapSizeLabel: document.getElementById('map-size-label'),
    mapStatus: document.getElementById('map-status'),
    places: document.getElementById('places'),
    search: document.getElementById('search'),
    searchInput: document.getElementById('search-input'),
    searchCount: document.getElementById('search-count'),
    searchClear: document.getElementById('search-clear'),
    searchStatus: document.getElementById('search-status'),
};

const state = {
    map: null,
    cluster: null,
    home: null,
    markers: new Map(),
    areas: [],
    visibleIds: null,
    needsFit: false,
    announceTimer: 0,
    selectedId: null,
    userDot: null,
    statusTimer: 0,
};

const offline = {
    isMapSaved: false,
    isSaving: false,
    hasFailed: false,
};

const toneFor = (place) => AREA_TONES[place.sectionIndex % AREA_TONES.length];
const countLabel = (count, one, many) => (count === 1 ? `1 ${one}` : `${count} ${many}`);
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');
const mapFlavor = () => (darkScheme.matches ? 'dark' : 'light');
const searchName = (place) =>
    plainText(place.name)
        .split(' — ')[0]
        .replace(/\s*\([^)]*\)$/, '');

function appleMapsUrl(place) {
    const query = encodeURIComponent(searchName(place));
    if (place.coordinates) {
        return `https://maps.apple.com/?q=${query}&ll=${place.coordinates.join(',')}`;
    }
    return `https://maps.apple.com/?q=${query}&address=${encodeURIComponent(place.address)}`;
}

function renderFact(place, field) {
    let value = renderInline(field.value);
    if (field.role === 'address') {
        value = `<a href="${escapeHtml(appleMapsUrl(place))}">${escapeHtml(place.address)}<span class="visually-hidden"> (opens Apple Maps)</span></a>`;
    }
    return `<div class="fact fact--${field.role}"><dt>${escapeHtml(field.label)}</dt><dd>${value}</dd></div>`;
}

function renderTravel(place) {
    if (place.travel.length === 0) {
        return '';
    }
    const items = place.travel
        .map(
            (item) =>
                `<li class="travel-item">${ICONS[item.mode]}<span>${escapeHtml(item.duration)}</span><span class="visually-hidden"> ${item.mode}</span></li>`
        )
        .join('');
    return `<ul class="travel" aria-label="Travel time">${items}</ul>`;
}

function renderPlace(place) {
    const food = place.fields.find((field) => field.role === 'food');
    const facts = place.fields.filter((field) => field !== food && !HIDDEN_FIELD_ROLES.has(field.role));
    const notes = place.notes.map((note) => `<p class="place-note">${renderInline(note)}</p>`).join('');
    const links = place.links
        .map(
            (link) =>
                `<a class="action" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.text)}${ICONS.external}</a>`
        )
        .join('');
    const mapAction = place.coordinates
        ? `<button class="action action--primary" type="button" data-show-on-map="${place.id}">${ICONS.pin}Show on map</button>`
        : '<p class="place-missing">Not on the map yet. Add a Coordinates line for this place in restaurants.md.</p>';
    const foodPreview = food
        ? `<p class="place-food"><span class="visually-hidden">${escapeHtml(food.label)}: </span><span class="place-food-text">${escapeHtml(plainText(food.value))}</span></p>`
        : '';

    return `
        <article class="place tone-${toneFor(place)}" id="${place.id}" aria-labelledby="${place.id}-name">
            <div class="place-summary">
                <span class="place-token" aria-hidden="true">${place.number}</span>
                <div class="place-heading">
                    <h3 class="place-name" id="${place.id}-name"><button class="place-toggle" type="button" aria-expanded="false" aria-controls="${place.id}-details" data-toggle="${place.id}"><span class="visually-hidden">${place.number}. </span><span class="place-name-text">${escapeHtml(plainText(place.name))}</span></button></h3>
                    ${renderTravel(place)}
                    ${foodPreview}
                    <p class="place-match" hidden></p>
                </div>
                ${ICONS.chevron}
            </div>
            <div class="place-details" id="${place.id}-details" inert>
                <div class="place-details-inner">
                    ${facts.length > 0 ? `<dl class="facts">${facts.map((field) => renderFact(place, field)).join('')}</dl>` : ''}
                    ${notes}
                    <div class="place-actions">${mapAction}${links}</div>
                </div>
            </div>
        </article>`;
}

function renderSection(section) {
    const tone = AREA_TONES[section.index % AREA_TONES.length];
    const intro = section.intro.map((text) => `<p class="area-intro">${renderInline(text)}</p>`).join('');
    const places =
        section.places.length > 0 ? `<div class="area-places">${section.places.map(renderPlace).join('')}</div>` : '';
    return `
        <section class="area tone-${tone}" id="area-section-${section.index}" aria-labelledby="area-${section.index}">
            <div class="area-header">
                <h2 class="area-title" id="area-${section.index}">${renderInline(section.name)}</h2>
                <span class="area-count">${countLabel(section.places.length, 'place', 'places')}</span>
            </div>
            ${intro}
            ${places}
        </section>`;
}

function renderPage(shortlist) {
    if (shortlist.title) {
        document.title = plainText(shortlist.title);
        elements.title.innerHTML = renderInline(shortlist.title);
    }
    if (shortlist.intro.length > 0) {
        elements.aboutBody.innerHTML = shortlist.intro.map((text) => `<p>${renderInline(text)}</p>`).join('');
        elements.about.hidden = false;
    }
    if (shortlist.places.length === 0) {
        elements.places.innerHTML =
            '<p class="status-message">No restaurants yet. Add a "### Restaurant name" heading for each place in restaurants.md.</p>';
        return;
    }
    elements.count.textContent = `${countLabel(shortlist.places.length, 'place', 'places')} in ${countLabel(
        shortlist.sections.length,
        'area',
        'areas'
    )}`;
    elements.meta.hidden = false;
    elements.places.innerHTML = `
        <div class="search-empty" id="search-empty" hidden>
            <p class="search-empty-title" id="search-empty-title"></p>
            <p>Try one word, such as a food or an area name.</p>
            <button class="action" type="button" data-clear-search>Clear the search</button>
        </div>
        ${shortlist.sections.map(renderSection).join('')}`;
    elements.searchEmpty = document.getElementById('search-empty');
    elements.searchEmptyTitle = document.getElementById('search-empty-title');
    state.areas = shortlist.sections.map((section) => {
        const element = document.getElementById(`area-section-${section.index}`);
        return {
            element,
            count: element.querySelector('.area-count'),
            total: section.places.length,
            places: section.places.map((place) => {
                const entry = document.getElementById(place.id);
                const food = entry.querySelector('.place-food-text');
                return {
                    id: place.id,
                    element: entry,
                    entries: makeSearchEntries(place, section.name),
                    name: entry.querySelector('.place-name-text'),
                    nameText: plainText(place.name),
                    food,
                    foodText: food?.textContent ?? '',
                    match: entry.querySelector('.place-match'),
                };
            }),
        };
    });
    elements.search.hidden = false;
}

function highlight(text, terms) {
    let html = '';
    let last = 0;
    for (const [start, end] of findRanges(text, terms)) {
        html += `${escapeHtml(text.slice(last, start))}<mark>${escapeHtml(text.slice(start, end))}</mark>`;
        last = end;
    }
    return html + escapeHtml(text.slice(last));
}

function renderMatch(item, result, terms) {
    item.element.hidden = !result.isMatch;
    item.name.innerHTML = highlight(item.nameText, terms);
    if (item.food) {
        item.food.innerHTML = highlight(item.foodText, terms);
    }
    const { snippet } = result;
    item.match.hidden = !snippet;
    item.match.innerHTML = snippet
        ? `${snippet.label ? `<span class="place-match-label">${escapeHtml(snippet.label)}:</span> ` : ''}${highlight(snippet.text, terms)}`
        : '';
}

function announceSearch(query, total) {
    window.clearTimeout(state.announceTimer);
    state.announceTimer = window.setTimeout(() => {
        let message = '';
        if (query && total === 0) {
            message = `No places match "${query}".`;
        } else if (query) {
            message = total === 1 ? `1 place matches "${query}".` : `${total} places match "${query}".`;
        }
        elements.searchStatus.textContent = message;
    }, SEARCH_ANNOUNCE_DELAY_MS);
}

function applySearch(rawQuery) {
    const query = rawQuery.trim();
    const terms = parseQuery(query);
    const isSearching = terms.length > 0;
    const visibleIds = new Set();
    for (const area of state.areas) {
        let shown = 0;
        for (const item of area.places) {
            const result = searchPlace(item.entries, terms);
            renderMatch(item, result, terms);
            if (result.isMatch) {
                shown += 1;
                visibleIds.add(item.id);
            }
        }
        area.element.hidden = shown === 0;
        const total = countLabel(area.total, 'place', 'places');
        area.count.textContent = isSearching ? `${shown} of ${total}` : total;
    }
    const total = visibleIds.size;
    elements.searchCount.textContent = isSearching ? countLabel(total, 'place', 'places') : '';
    elements.searchClear.hidden = rawQuery === '';
    elements.searchEmpty.hidden = !isSearching || total > 0;
    elements.searchEmptyTitle.textContent = `No places match "${query}".`;
    announceSearch(query, total);
    filterMap(isSearching ? visibleIds : null);
}

function filterMap(visibleIds) {
    const previous = state.visibleIds;
    state.visibleIds = visibleIds;
    if (!state.cluster) {
        return;
    }
    const isSame =
        previous === visibleIds ||
        (previous && visibleIds && previous.size === visibleIds.size && [...visibleIds].every((id) => previous.has(id)));
    if (isSame) {
        return;
    }
    state.needsFit = true;
    if (state.selectedId && visibleIds && !visibleIds.has(state.selectedId)) {
        state.map.closePopup();
    }
    const show = [];
    const hide = [];
    for (const [id, marker] of state.markers) {
        const isShown = !visibleIds || visibleIds.has(id);
        if (isShown !== state.cluster.hasLayer(marker)) {
            (isShown ? show : hide).push(marker);
        }
    }
    state.cluster.removeLayers(hide);
    state.cluster.addLayers(show);
}

function scrollToResults() {
    const top = elements.masthead.offsetHeight;
    if (window.scrollY > top) {
        window.scrollTo({ top, behavior: 'auto' });
    }
}

function clearSearch() {
    elements.searchInput.value = '';
    applySearch('');
    elements.searchInput.focus();
}

function initSearch() {
    const input = elements.searchInput;
    input.addEventListener('input', () => {
        applySearch(input.value);
        scrollToResults();
    });
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && input.value) {
            event.preventDefault();
            clearSearch();
        }
    });
    input.addEventListener('focus', () => {
        root.classList.add('is-searching');
        const top = elements.masthead.offsetHeight;
        if (window.scrollY < top) {
            window.requestAnimationFrame(() => window.scrollTo({ top, behavior: 'auto' }));
        }
    });
    input.addEventListener('blur', () => {
        root.classList.remove('is-searching');
        if (!state.needsFit || !state.map) {
            return;
        }
        state.needsFit = false;
        window.setTimeout(
            () => {
                state.map.invalidateSize();
                showAll();
            },
            reducedMotion.matches ? 0 : MAP_RESIZE_MS
        );
    });
    elements.search.addEventListener('submit', (event) => {
        event.preventDefault();
        input.blur();
    });
    elements.searchClear.addEventListener('click', clearSearch);
    elements.places.addEventListener('click', (event) => {
        if (event.target.closest('[data-clear-search]')) {
            clearSearch();
        }
    });
}

function renderLoadError(error) {
    let hint = 'Make sure restaurants.md is in the same folder as index.html, then reload the page.';
    if (window.location.protocol === 'file:') {
        hint = 'Open the site through a web server, not as a file. The README shows a one-line command.';
    } else if (!navigator.onLine) {
        hint = 'You are offline, and this phone has no saved copy yet. Open the site once with a connection.';
    }
    elements.mapFrame.hidden = true;
    elements.places.innerHTML = `<div class="status-message"><p><strong>Could not load restaurants.md.</strong></p><p>${hint}</p></div>`;
    console.error(error);
}

function pinHtml(token) {
    if (token.kind === 'home') {
        return `<span class="pin pin--home">${HOME_GLYPH}</span>`;
    }
    return `<span class="pin tone-${token.tone}">${token.number}</span>`;
}

function placeIcon(token) {
    return window.L.divIcon({
        className: 'pin-anchor',
        html: pinHtml(token),
        iconSize: [PIN_SIZE, PIN_SIZE],
        popupAnchor: [0, -PIN_SIZE / 2],
    });
}

function clusterIcon(cluster) {
    const tokens = cluster.getAllChildMarkers().map((marker) => marker.options.token);
    const count = tokens.filter((token) => token.kind === 'place').length;
    const hasHome = tokens.some((token) => token.kind === 'home');
    const description = `${countLabel(count, 'place', 'places')}${hasHome ? ' and the starting point' : ''}. Zoom in to see each one.`;
    return window.L.divIcon({
        className: 'pin-anchor',
        html: `<span class="cluster">${hasHome ? HOME_GLYPH : ''}<span aria-hidden="true">${count}</span><span class="visually-hidden">${description}</span></span>`,
        iconSize: [CLUSTER_SIZE + (hasHome ? CLUSTER_HOME_WIDTH : 0), CLUSTER_SIZE],
    });
}

function popupContent(place) {
    const content = document.createElement('div');
    content.className = `popup tone-${toneFor(place)}`;
    const travel = place.travel.map((item) => item.text).join(', ');
    content.innerHTML = `
        <p class="popup-name">${place.number}. ${renderInline(place.name)}</p>
        ${travel ? `<p class="popup-meta">${escapeHtml(travel)}</p>` : ''}
        <button class="action action--primary" type="button">See details</button>`;
    content.querySelector('button').addEventListener('click', () => showDetails(place.id));
    return content;
}

function homePopupContent(start) {
    const [name, ...address] = start.name.split(', ');
    return `<p class="popup-name">${escapeHtml(name || 'Starting point')}</p>${
        address.length > 0 ? `<p class="popup-meta">${escapeHtml(address.join(', '))}</p>` : ''
    }`;
}

function select(id) {
    const previousId = state.selectedId;
    state.selectedId = id;
    for (const [entryId, isSelected] of [
        [previousId, false],
        [id, true],
    ]) {
        if (!entryId) {
            continue;
        }
        document.getElementById(entryId)?.classList.toggle('is-selected', isSelected);
        const marker = state.markers.get(entryId);
        marker?.getElement()?.querySelector('.pin')?.classList.toggle('is-selected', isSelected);
        marker?.setZIndexOffset(isSelected ? 1000 : 0);
    }
}

function setMapLarge(isLarge) {
    document.documentElement.classList.toggle('map-large', isLarge);
    elements.mapSize.setAttribute('aria-pressed', String(isLarge));
    elements.mapSizeLabel.textContent = isLarge ? 'Smaller map' : 'Larger map';
}

function setOpen(id, isOpen) {
    const entry = document.getElementById(id);
    if (!entry) {
        return;
    }
    entry.classList.toggle('is-open', isOpen);
    entry.querySelector('.place-toggle')?.setAttribute('aria-expanded', String(isOpen));
    const details = entry.querySelector('.place-details');
    if (details) {
        details.inert = !isOpen;
    }
}

function showStatus(message) {
    window.clearTimeout(state.statusTimer);
    elements.mapStatus.textContent = message;
    state.statusTimer = window.setTimeout(() => {
        elements.mapStatus.textContent = '';
    }, STATUS_DURATION_MS);
}

function visibleBounds() {
    const points = [];
    for (const [id, marker] of state.markers) {
        if (!state.visibleIds || state.visibleIds.has(id)) {
            points.push(marker.getLatLng());
        }
    }
    if (state.home && !state.visibleIds) {
        points.push(state.home.getLatLng());
    }
    return points.length > 0 ? window.L.latLngBounds(points) : null;
}

function showAll() {
    const bounds = visibleBounds();
    if (bounds) {
        state.map.fitBounds(bounds, {
            paddingTopLeft: [28, 72],
            paddingBottomRight: [28, 60],
            maxZoom: 15,
            animate: !reducedMotion.matches,
        });
    }
}

function showOnMap(id) {
    const marker = state.markers.get(id);
    if (!marker) {
        return;
    }
    const target = marker.getLatLng();
    const zoom = Math.max(state.map.getZoom(), DETAIL_ZOOM);
    state.map.once('moveend', () => state.cluster.zoomToShowLayer(marker, () => marker.openPopup()));
    if (reducedMotion.matches) {
        state.map.setView(target, zoom, { animate: false });
    } else {
        state.map.flyTo(target, zoom, { duration: 0.8 });
    }
}

function showDetails(id) {
    const entry = document.getElementById(id);
    if (!entry) {
        return;
    }
    setOpen(id, true);
    setMapLarge(false);
    entry.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    entry.querySelector('.place-toggle')?.focus({ preventScroll: true });
}

function locate() {
    if (!window.isSecureContext) {
        showStatus('Location works only when the site opens from an https address.');
        return;
    }
    elements.locate.disabled = true;
    state.map.locate({ enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 });
}

function handleLocationFound(event) {
    elements.locate.disabled = false;
    if (state.userDot) {
        state.userDot.setLatLng(event.latlng);
    } else {
        state.userDot = window.L.circleMarker(event.latlng, {
            radius: 8,
            weight: 3,
            color: '#ffffff',
            fillColor: '#0a84ff',
            fillOpacity: 1,
            interactive: false,
        }).addTo(state.map);
    }
    state.map.setView(event.latlng, Math.max(state.map.getZoom(), 13), { animate: !reducedMotion.matches });
}

function handleLocationError(event) {
    elements.locate.disabled = false;
    showStatus(
        event.code === 1
            ? 'Location access is off for this site. Turn it on in Safari settings, then try again.'
            : 'Your location is not available right now. Try again in a moment.'
    );
}

function initMap(shortlist) {
    const L = window.L;
    if (!L?.markerClusterGroup || !window.protomapsL?.paintRules) {
        elements.mapFrame.hidden = true;
        document.documentElement.classList.add('no-map');
        return;
    }

    const isAnimated = !reducedMotion.matches;
    const map = L.map(elements.map, {
        zoomControl: false,
        minZoom: 9,
        maxZoom: 19,
        maxBounds: OAHU_BOUNDS,
        maxBoundsViscosity: 1,
        zoomAnimation: isAnimated,
        fadeAnimation: isAnimated,
        markerZoomAnimation: isAnimated,
    });
    const makeBasemap = () => {
        const flavor = MAP_FLAVORS[mapFlavor()];
        return window.protomapsL.leafletLayer({
            url: TILES_URL,
            paintRules: window.protomapsL.paintRules(flavor),
            labelRules: window.protomapsL.labelRules(flavor, 'en'),
            backgroundColor: flavor.background,
            attribution: TILE_ATTRIBUTION,
            maxDataZoom: TILES_MAX_ZOOM,
            bounds: OAHU_BOUNDS,
        });
    };
    let basemap = makeBasemap().addTo(map);
    darkScheme.addEventListener('change', () => {
        map.removeLayer(basemap);
        basemap = makeBasemap().addTo(map);
    });

    const cluster = L.markerClusterGroup({
        maxClusterRadius: 44,
        disableClusteringAtZoom: 17,
        showCoverageOnHover: false,
        animate: isAnimated,
        iconCreateFunction: clusterIcon,
    });

    const points = [];
    if (shortlist.start.coordinates) {
        const token = { kind: 'home', number: 0 };
        const home = L.marker(shortlist.start.coordinates, {
            icon: placeIcon(token),
            title: shortlist.start.name || 'Starting point',
            token,
        });
        home.bindPopup(homePopupContent(shortlist.start));
        cluster.addLayer(home);
        state.home = home;
        points.push(shortlist.start.coordinates);
    }

    for (const place of shortlist.places) {
        if (!place.coordinates) {
            continue;
        }
        const token = { kind: 'place', number: place.number, tone: toneFor(place) };
        const marker = L.marker(place.coordinates, {
            icon: placeIcon(token),
            title: plainText(place.name),
            token,
        });
        marker.bindPopup(() => popupContent(place), {
            maxWidth: 260,
            autoPanPaddingTopLeft: [16, 72],
            autoPanPaddingBottomRight: [16, 72],
        });
        marker.on('popupopen', () => select(place.id));
        marker.on('popupclose', () => {
            if (state.selectedId === place.id) {
                select(null);
            }
        });
        cluster.addLayer(marker);
        state.markers.set(place.id, marker);
        points.push(place.coordinates);
    }

    map.addLayer(cluster);
    map.on('locationfound', handleLocationFound);
    map.on('locationerror', handleLocationError);

    state.map = map;
    state.cluster = cluster;
    if (points.length > 0) {
        showAll();
    } else {
        map.setView([21.44, -157.97], 10);
    }

    new ResizeObserver(() => map.invalidateSize()).observe(elements.map);
    elements.showAll.addEventListener('click', showAll);
    elements.locate.addEventListener('click', locate);
    elements.mapSize.addEventListener('click', () => {
        setMapLarge(!document.documentElement.classList.contains('map-large'));
    });
    elements.places.addEventListener('click', (event) => {
        const button = event.target.closest('[data-show-on-map]');
        if (button) {
            showOnMap(button.dataset.showOnMap);
        }
    });
}

function handleToggle(event) {
    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
        setOpen(toggle.dataset.toggle, toggle.getAttribute('aria-expanded') !== 'true');
    }
}

function renderOfflineStatus() {
    let key = null;
    if (!navigator.onLine) {
        key = offline.isMapSaved ? 'offlineSaved' : 'offlineMissing';
    } else if (offline.isMapSaved) {
        key = 'ready';
    } else if (offline.hasFailed) {
        key = 'failed';
    } else if (offline.isSaving) {
        key = 'saving';
    }
    if (!key) {
        elements.offlineStatus.textContent = '';
        return;
    }
    const [iconName, text] = OFFLINE_MESSAGES[key];
    elements.offlineStatus.dataset.state = iconName;
    elements.offlineStatus.innerHTML = `${ICONS[iconName]}${escapeHtml(text)}`;
}

async function requestMapSave() {
    offline.isSaving = true;
    offline.hasFailed = false;
    renderOfflineStatus();
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: 'save-map' });
}

function handleWorkerMessage(event) {
    if (event.data?.type === 'map-saved') {
        offline.isMapSaved = true;
    } else if (event.data?.type === 'map-failed') {
        offline.hasFailed = true;
        console.error(event.data.message);
    } else {
        return;
    }
    offline.isSaving = false;
    renderOfflineStatus();
}

async function startOffline() {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
    window.addEventListener('offline', renderOfflineStatus);
    window.addEventListener('online', () => {
        if (offline.isMapSaved) {
            renderOfflineStatus();
        } else {
            requestMapSave();
        }
    });
    try {
        await navigator.serviceWorker.register('sw.js');
        navigator.storage?.persist?.();
        offline.isMapSaved = Boolean(await caches.match(new URL(TILES_URL, document.baseURI).href));
    } catch (error) {
        console.error(error);
        return;
    }
    if (offline.isMapSaved || !navigator.onLine) {
        renderOfflineStatus();
    } else {
        requestMapSave();
    }
}

async function main() {
    startOffline();
    let shortlist;
    try {
        const response = await fetch(DATA_URL, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`${DATA_URL} returned HTTP ${response.status}`);
        }
        shortlist = parseShortlist(await response.text());
    } catch (error) {
        renderLoadError(error);
        return;
    }
    renderPage(shortlist);
    elements.places.addEventListener('click', handleToggle);
    if (shortlist.places.length > 0) {
        initSearch();
    }
    initMap(shortlist);
}

main();
