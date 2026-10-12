import { escapeHtml, parseShortlist, plainText, renderInline } from './parse.js';

const DATA_URL = 'restaurants.md';
const AREA_TONES = ['lagoon', 'ahi', 'ube', 'tileaf', 'lilikoi'];
const HIDDEN_FIELD_ROLES = new Set(['coordinates', 'sources']);
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
const PIN_SIZE = 30;
const STACK_STEP = 20;
const STACK_LIMIT = 5;
const STATUS_DURATION_MS = 6000;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

const elements = {
    title: document.getElementById('title'),
    about: document.getElementById('about'),
    aboutBody: document.getElementById('about-body'),
    mapFrame: document.getElementById('map-frame'),
    map: document.getElementById('map'),
    showAll: document.getElementById('show-all'),
    locate: document.getElementById('locate'),
    mapSize: document.getElementById('map-size'),
    mapStatus: document.getElementById('map-status'),
    places: document.getElementById('places'),
};

const state = {
    map: null,
    cluster: null,
    bounds: null,
    markers: new Map(),
    selectedId: null,
    userDot: null,
    statusTimer: 0,
};

const toneFor = (place) => AREA_TONES[place.sectionIndex % AREA_TONES.length];
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');
const mapFlavor = () => (darkScheme.matches ? 'dark' : 'light');
const searchName = (place) => plainText(place.name).split(' — ')[0];

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

function renderPlace(place) {
    const facts = place.fields.filter((field) => !HIDDEN_FIELD_ROLES.has(field.role));
    const travel = place.travel.map((item) => `<li class="travel-chip">${escapeHtml(item.text)}</li>`).join('');
    const notes = place.notes.map((note) => `<p class="place-note">${renderInline(note)}</p>`).join('');
    const links = place.links
        .map(
            (link) =>
                `<a class="action" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.text)}</a>`
        )
        .join('');
    const mapAction = place.coordinates
        ? `<button class="action action--primary" type="button" data-show-on-map="${place.id}">Show on map</button>`
        : '<p class="place-missing">Not on the map yet. Add a Coordinates line for this place in restaurants.md.</p>';

    return `
        <article class="place tone-${toneFor(place)}" id="${place.id}" aria-labelledby="${place.id}-name">
            <span class="place-token" aria-hidden="true">${place.number}</span>
            <div class="place-body">
                <h3 class="place-name" id="${place.id}-name" tabindex="-1"><span class="visually-hidden">${place.number}. </span>${renderInline(place.name)}</h3>
                ${travel ? `<ul class="travel" aria-label="Travel time">${travel}</ul>` : ''}
                ${facts.length > 0 ? `<dl class="facts">${facts.map((field) => renderFact(place, field)).join('')}</dl>` : ''}
                ${notes}
                <div class="place-actions">${mapAction}${links}</div>
            </div>
        </article>`;
}

function renderSection(section) {
    const tone = AREA_TONES[section.index % AREA_TONES.length];
    const intro = section.intro.map((text) => `<p class="area-intro">${renderInline(text)}</p>`).join('');
    return `
        <section class="area tone-${tone}" aria-labelledby="area-${section.index}">
            <h2 class="area-title" id="area-${section.index}">${renderInline(section.name)}</h2>
            ${intro}
            ${section.places.map(renderPlace).join('')}
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
    elements.places.innerHTML = shortlist.sections.map(renderSection).join('');
}

function renderLoadError(error) {
    const hint =
        window.location.protocol === 'file:'
            ? 'Open the site through a web server, not as a file. The README shows a one-line command.'
            : 'Make sure restaurants.md is in the same folder as index.html, then reload the page.';
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
    const tokens = cluster
        .getAllChildMarkers()
        .map((marker) => marker.options.token)
        .sort((a, b) => a.number - b.number);
    const shown = tokens.slice(0, STACK_LIMIT);
    const extra = tokens.length - shown.length;
    const more = extra > 0 ? `<span class="pin pin--more">+${extra}</span>` : '';
    const slots = shown.length + (extra > 0 ? 1 : 0);
    const width = 8 + PIN_SIZE + STACK_STEP * (slots - 1);
    return window.L.divIcon({
        className: 'pin-anchor',
        html: `<span class="pin-stack">${shown.map(pinHtml).join('')}${more}<span class="visually-hidden">${tokens.length} places. Zoom in to see each one.</span></span>`,
        iconSize: [width, PIN_SIZE + 8],
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
    elements.mapSize.textContent = isLarge ? 'Smaller map' : 'Larger map';
}

function showStatus(message) {
    window.clearTimeout(state.statusTimer);
    elements.mapStatus.textContent = message;
    state.statusTimer = window.setTimeout(() => {
        elements.mapStatus.textContent = '';
    }, STATUS_DURATION_MS);
}

function showAll() {
    if (state.bounds) {
        state.map.fitBounds(state.bounds, {
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
    setMapLarge(false);
    entry.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    entry.querySelector('.place-name')?.focus({ preventScroll: true });
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
    if (!L?.markerClusterGroup || !window.protomapsL) {
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
    const makeBasemap = () =>
        window.protomapsL.leafletLayer({
            url: TILES_URL,
            flavor: mapFlavor(),
            lang: 'en',
            attribution: TILE_ATTRIBUTION,
            maxDataZoom: TILES_MAX_ZOOM,
            bounds: OAHU_BOUNDS,
        });
    let basemap = makeBasemap().addTo(map);
    darkScheme.addEventListener('change', () => {
        map.removeLayer(basemap);
        basemap = makeBasemap().addTo(map);
    });

    const cluster = L.markerClusterGroup({
        maxClusterRadius: 36,
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
        marker.bindPopup(() => popupContent(place), { maxWidth: 260, autoPanPadding: [16, 16] });
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
    state.bounds = points.length > 0 ? L.latLngBounds(points) : null;
    if (state.bounds) {
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

async function main() {
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
    initMap(shortlist);
}

main();
