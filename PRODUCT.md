# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- The owner of the site and their travel group, on one trip to Oahu.
- The owner shares the link with the group. Each person uses the site on a phone, in Safari or from the iPhone home screen.
- The group stays at Four Seasons Resort Oahu at Ko Olina. The site calls the hotel the "starting point".

## Product Purpose

The site is a restaurant shortlist and a map for the trip. The group uses it for two jobs, with equal weight:

1. Plan at the hotel: read the notes and the sources, then choose places for the next days.
2. Decide while out on the island: find a good place, check the travel time, and start directions.

Success: any person in the group can choose a place and open directions without help from the owner.

## Positioning

- Each place shows where the recommendation came from. The list keeps the trip-report poster, the thread commenters, and the restaurant's own menu highlights apart.
- Travel times start from the group's hotel, not from a general location.
- The owner selects every place by hand in one Markdown file.
- The map of Oahu ships with the site. It needs no map service and no API key.

## Operating Context

- People use the site on a phone at the hotel and while they travel on the island. The site follows the iPhone light or dark appearance setting.
- The owner edits `restaurants.md`, pushes it to GitHub, and GitHub Pages serves the new version.
- Content sources: a Reddit trip report ("the poster"), replies in two Oahu trip-planning threads ("commenters"), official restaurant websites, and route estimates from Google Maps and OpenStreetMap.
- The address link opens Apple Maps. Source links open Google Maps directions or the restaurant website.

## Capabilities and Constraints

Capabilities:

- `parse.js` reads `restaurants.md`: `##` headings are areas, `###` headings are places, and `- **Label:** value` bullets are fields.
- Labels with a special use: `Coordinates`, `Address`, labels with "travel time", labels with "food", labels with "post" or "comment", and `Sources`.
- The list groups places by area and numbers them in file order. Each card shows a summary. A touch opens the details and the links.
- The map shows numbered pins in area colors, a pin for the hotel, and groups of nearby pins. It has "Show all", "My location" (https only), and a larger map on the phone.
- Keyword search: one field under the map searches the names, areas, food, other fields, and notes. It ignores accents and the okina, and it matches the start of words. The list and the map show only the matches.
- Offline use: the site shows "Saving", "Ready to use offline", or "Offline" under the title. With a connection, the list loads fresh. After 3 seconds with no answer, the site shows the saved copy.

Constraints confirmed by the owner:

- All content stays in `restaurants.md`. There is no build step and no database.
- Text must be large and easy to read. A person in the group needs clear text, so legibility comes before style.
- The site must stay useful with weak or no cell signal. A service worker (`sw.js`) saves the site, the list, and the 11 MB map file on the phone after the first visit. The first visit needs a connection.
- Hosting stays free and static on GitHub Pages, with no API keys and no paid services. The host must support HTTP range requests for the map file.

Other facts:

- Anyone with the link can see the list, and the list names the hotel.
- Terms: "area", "place", "starting point", "the poster", "commenters".

## Brand Commitments

- Name: "Oahu food shortlist". The page title comes from the `#` heading in `restaurants.md`.
- Voice: plain, literal English in short sentences, with no hype.

## Evidence on Hand

- `restaurants.md`: 52 places in 9 areas. Each place has an address, coordinates, a travel time, food to consider, and source links.
- Most places have a commenter recommendation. A few places have a recommendation from the poster.
- Absences: there are no photos, ratings, prices, or confirmed opening hours. Hours change often. Do not invent any of these.

## Product Principles

1. Keep the sources visible. Never merge what the poster, the commenters, and the restaurant said.
2. Put legibility first. Clear, large text and strong contrast come before decoration.
3. Help a fast decision on the phone. Show the name, the travel time, and the food first. Details wait for a touch.
4. Keep one file as the source of truth. Every feature must work from `restaurants.md` without a build step.
5. Prefer local files over network services, so the site works on a weak connection.

## Accessibility & Inclusion

- A person in the group needs clear, large text. Current baseline: body text 16 px or larger, WCAG AA contrast or better, and touch targets 44 px or larger.
- The font is Atkinson Hyperlegible Next, which the Braille Institute designed for easy reading.
- The site respects the reduced motion setting.
