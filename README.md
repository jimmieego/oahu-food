# Oahu food shortlist

A static website that shows the restaurant shortlist as a list and a map. It is designed for an iPhone.

All the content comes from `restaurants.md`. To change the site, edit that file. You do not need a build step.

The site is self-contained. The map tiles for Oahu, the map libraries, and the font are in this folder. The site does not need an API key or any other service. After the first visit, the site also works with no connection. See [Use the site offline](#use-the-site-offline).

## Files

| File | Purpose |
|---|---|
| `restaurants.md` | The restaurant list. Edit this file. |
| `index.html`, `styles.css`, `app.js` | The page, the styles, and the map code. |
| `map-theme.js` | The map colors for the light appearance and the dark appearance. |
| `sw.js` | The service worker. It saves the site and the map on the phone for offline use. |
| `parse.js` | Reads `restaurants.md` and converts it into data for the page. |
| `tests/parse.test.js` | Tests for the parser. Also checks that each restaurant has coordinates. |
| `tiles/oahu.pmtiles` | The map of Oahu, zoom levels 0 to 15, in one file (11 MB). |
| `vendor/` | Leaflet, Leaflet.markercluster, protomaps-leaflet, and the font, with their licenses. |
| `manifest.webmanifest`, `icons/` | The name and icon for the iPhone home screen. |
| `.nojekyll` | Stops GitHub Pages from converting the Markdown files into HTML pages. Do not delete it. |

## Search

The search field under the map finds restaurants by keyword. It searches the name, the area, the food, the other fields, and the notes. It does not search the links.

- Each word must match the start of a word in the restaurant. For example, "shave ice" finds places with both words.
- Accents and the okina do not matter. "Haleiwa" finds "Haleʻiwa".
- The list and the map show only the matches. Press Search on the keyboard to close the keyboard and zoom the map to the matches.
- If a match is only in the details, a short line under the restaurant shows where the word is.

## Add a restaurant

1. Open `restaurants.md`.
2. Copy the template from the comment at the end of the file.
3. Paste it under an area heading (a line that starts with `##`). To start a new area, add a `## Area name` heading.
4. Fill in the fields.

Example:

```markdown
### Leonard's Bakery

- **Address:** 933 Kapahulu Avenue, Honolulu, HI 96816.
- **Coordinates:** 21.28491, -157.81328
- **Approximate travel time:** 40–60 minutes driving.
- **Food to consider:** Malasadas.
- **Post recommendation:** Not in the post. A friend recommended it.
- **Sources:** [Official website](https://www.leonardshawaii.com/)
```

Rules for the format:

- Each restaurant starts with a `###` heading. The site numbers the restaurants in the order they appear. Numbers in the heading, such as `### 9.`, are optional.
- Each field is a bullet in the form `- **Label:** value`. You can use any label. The site shows the fields in the order you write them.
- The list shows a summary of each restaurant: the name, the travel time, and the food to consider. Touch a restaurant to see the other fields and the links.
- Some labels have a special use:
  - `Coordinates` puts the pin on the map. The site does not show this line.
  - `Address` becomes a link that opens Apple Maps.
  - A label that contains "travel time" gives the short time labels under the name, for example "2–5 min drive". Write the time as "25–40 minutes driving" or "5 minutes walking".
  - A label that contains "food", "dish", "order", or "menu" shows in the summary, under the travel time.
  - A label that contains "post" gets a yellow box. Use it for what the Reddit poster said.
  - `Sources` turns each Markdown link into a button.
- You can use `**bold**`, `*italic*`, and `[links](https://example.com)` in any value.

### Get the coordinates

The map needs a latitude and a longitude for each place. A restaurant without coordinates still shows in the list, with a note that it is not on the map.

On an iPhone with Google Maps:

1. Search for the restaurant.
2. Touch and hold the exact building until a red pin drops.
3. Copy the two numbers from the search box, for example `21.27930, -157.82851`.

On a Mac with Google Maps in a browser, right-click the building. The first menu item shows the coordinates. Click it to copy them.

Paste the numbers after `**Coordinates:**`. The latitude comes first. On Oahu, the latitude is near 21 and the longitude is near -158.

### Check your edits

If you use a computer with Node.js, run this command in the project folder:

```sh
node --test
```

The tests fail if a restaurant has no coordinates or if the parser cannot read the file.

## Preview on a computer

Use a local web server. Opening `index.html` directly as a file does not work, because the page must load `restaurants.md` and the map file over the web.

The server must support HTTP range requests, because the page reads only the parts of `tiles/oahu.pmtiles` that it needs. `live-server` supports them:

```sh
npx live-server
```

`python3 -m http.server` does not support range requests, so the map stays blank with it.

## Put the site on your iPhone

The site needs a host with an https address that supports range requests. Location on the map ("My location") works only over https.

GitHub Pages is free and meets both requirements:

1. Push this folder to a GitHub repository.
2. In the repository settings, open Pages.
3. Select the main branch as the source.

Anyone who has the address can see the list. The list includes the name of your hotel.

To use the site like an app:

1. Open the site in Safari.
2. Touch the Share button.
3. Select "Add to Home Screen".

After you change `restaurants.md`, push the new version. When the phone has a connection, the site loads the newest copy of the file. If the server does not answer in 3 seconds, the site shows the saved copy.

## Use the site offline

On the first visit, the site saves itself and the map on the phone. The map file is 11 MB. Each person in the group does these steps on their own phone, on Wi-Fi, before the trip:

1. Add the site to the home screen. See [Put the site on your iPhone](#put-the-site-on-your-iphone).
2. Open the site from the home screen.
3. Wait until the site shows "Ready to use offline".

The home screen app and Safari keep separate saved copies. A copy that Safari saved does not work in the home screen app.

Under the title, the site shows the offline state:

- "Saving the map for offline use": the download is in progress. Keep the site open.
- "Ready to use offline": the list and the map work with no connection.
- "Offline. You see the saved copy.": the phone has no connection. The list is from the last visit with a connection.

Safari can delete the saved data of a website that you do not open for 7 days. It does not do this for a site on the home screen.

Directions open in Apple Maps or Google Maps. These apps need a connection, unless you download the Oahu map in the app before the trip.

After you change `app.js`, `styles.css`, or `index.html`, the phone shows the change on the second visit. The first visit downloads the new file in the background.

If you replace a file in `vendor/` or `icons/`, increase `SHELL_VERSION` at the top of `sw.js` by 1. Otherwise phones keep the old file.

## Update the map tiles

The tiles come from the [Protomaps](https://protomaps.com/) daily build of OpenStreetMap data. The current file is from the build of 12 October 2026. To get newer map data, install the `pmtiles` tool and extract Oahu again:

```sh
brew install pmtiles
pmtiles extract https://build.protomaps.com/YYYYMMDD.pmtiles tiles/oahu.pmtiles \
  --bbox=-158.32,21.22,-157.62,21.74 --maxzoom=15
```

Replace `YYYYMMDD` with a recent date, for example `20261012`. The list of builds is at <https://maps.protomaps.com/builds/>. Do not download tiles from the OpenStreetMap tile servers. Their usage policy does not allow bulk downloads.

Then change `TILES_VERSION` at the top of `sw.js` to the same date. This tells the phones to delete the old saved map and save the new one.

## What is in the vendor folder

- [Leaflet](https://leafletjs.com/) 1.9.4 and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5.3 show the map and the pins.
- [protomaps-leaflet](https://github.com/protomaps/protomaps-leaflet) 5.1.0 draws the map from `tiles/oahu.pmtiles`. The map colors are in `map-theme.js`. The site uses the light colors or the dark colors to match the iPhone appearance setting.
- [Atkinson Hyperlegible Next](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next) is the font. The Braille Institute designed it for easy reading.

Map data is &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. If the map libraries do not load, the list still works without the map.
