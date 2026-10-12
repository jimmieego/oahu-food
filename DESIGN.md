---
name: Oahu food shortlist
description: A calm, legible restaurant list and island map for one group trip to Oahu.
colors:
  lagoon-teal: "#0f6e77"
  on-lagoon: "#ffffff"
  deep-channel-ink: "#14292d"
  weathered-teal-gray: "#5b6d70"
  shore-mist: "#f3f5f4"
  card-white: "#ffffff"
  foam: "#ebf0ef"
  hairline: "rgb(20 41 45 / 0.1)"
  beach-sand: "#f6efdb"
  tidemark-ochre: "#75571a"
  sea-glass: "#cfe3e5"
  pale-sand-earth: "#f0efea"
  area-lagoon: "#2b7a80"
  area-ahi: "#b4534f"
  area-ube: "#6d5ea8"
  area-tileaf: "#4d7a45"
  area-lilikoi: "#95611f"
  area-reef: "#3d6aa0"
  area-hibiscus: "#a5507a"
  area-koa: "#87613f"
  area-slate: "#5a6772"
  lagoon-teal-night: "#67c6cc"
  on-lagoon-night: "#0b1a1c"
  deep-channel-ink-night: "#e3edeb"
  weathered-teal-gray-night: "#9db1af"
  shore-mist-night: "#0d1618"
  card-white-night: "#152124"
  foam-night: "#1f2e31"
  hairline-night: "rgb(227 237 235 / 0.1)"
  beach-sand-night: "#26261d"
  tidemark-ochre-night: "#dcc48a"
  sea-glass-night: "#0e171a"
  pale-sand-earth-night: "#212c2f"
  area-lagoon-night: "#7fc4c8"
  area-ahi-night: "#e59a94"
  area-ube-night: "#b2a6e4"
  area-tileaf-night: "#9dc58f"
  area-lilikoi-night: "#ddb075"
  area-reef-night: "#95b5e2"
  area-hibiscus-night: "#e0a0c1"
  area-koa-night: "#cfaa85"
  area-slate-night: "#aab5bf"
  on-area-night: "#0c1a1d"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-summary:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.01em"
  button:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.25
  numeral:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  pill: "999px"
  group: "20px"
  popup: "18px"
  toast: "16px"
  panel: "14px"
  home-pin: "9px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  section: "32px"
  row-inset: "58px"
components:
  button-primary:
    backgroundColor: "{colors.lagoon-teal}"
    textColor: "{colors.on-lagoon}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 16px 8px 14px"
    height: "44px"
  button-tonal:
    backgroundColor: "{colors.foam}"
    textColor: "{colors.deep-channel-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "44px"
  map-control:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-channel-ink}"
    rounded: "{rounded.pill}"
    padding: "0 15px 0 13px"
    height: "44px"
  area-group:
    backgroundColor: "{colors.card-white}"
    rounded: "{rounded.group}"
  place-row:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-channel-ink}"
    typography: "{typography.title}"
    padding: "14px 16px 15px"
  place-token:
    backgroundColor: "{colors.area-lagoon}"
    textColor: "{colors.on-lagoon}"
    typography: "{typography.numeral}"
    rounded: "{rounded.round}"
    size: "28px"
  note-box:
    backgroundColor: "{colors.beach-sand}"
    textColor: "{colors.deep-channel-ink}"
    rounded: "{rounded.panel}"
    padding: "12px 14px 13px"
  map-cluster:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-channel-ink}"
    rounded: "{rounded.pill}"
    height: "36px"
  map-popup:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.deep-channel-ink}"
    rounded: "{rounded.popup}"
  status-toast:
    backgroundColor: "{colors.deep-channel-ink}"
    textColor: "{colors.shore-mist}"
    rounded: "{rounded.toast}"
    padding: "12px 16px"
---

# Design System: Oahu food shortlist

## Overview

**Creative North Star: "The Pocket Field Guide"**

The site is a field guide that the group carries on the island. A field guide is clear before it is pretty. It names each thing, says where it is, and says who vouched for it. The visual system follows the same order: legible type, plain facts, and a map that you can read at a glance. The mood is clean, modern, and relaxed. Nothing on the page competes for attention.

The page is calm and open. A soft blue-green map sits at the top. White groups of restaurants rest on a pale, cool ground below it. Lagoon Teal is the only action color. Small colored dots connect each restaurant in the list to its pin on the map. The components are soft and friendly: round capsules, rounded white groups, and gentle shadows only where something floats over the map.

The system replaced an earlier, louder look: bright cyan water, nine saturated area colors on headings and buttons, and extra-bold type on every line. That look is the visual anti-reference.

**Key Characteristics:**

- One accent color, Lagoon Teal, for actions, the address link, and focus.
- Muted area tones in small circles only.
- One typeface, Atkinson Hyperlegible Next, with a tight scale and no weight above 700.
- A summary first: name, travel time, and food. Details open on a touch.
- White grouped lists with thin dividers, in the style of an iPhone settings list.
- A calm map palette that matches the page in light and dark.

## Colors

A restrained palette of cool sea neutrals, one deep teal accent, and nine muted area tones that stay small.

### Primary

- **Lagoon Teal** (`lagoon-teal`): the primary button ("Show on map"), the "See details" button in map popups, the address link, the "About this list" control, map control icons, the "Ready to use offline" check, and the focus ring. At night it becomes a lighter lagoon (`lagoon-teal-night`) with dark text on it (`on-lagoon-night`).

### Secondary

- **Beach Sand** (`beach-sand`) with **Tidemark Ochre** labels (`tidemark-ochre`): the note box for what the trip-report poster and the commenters said. It is the only warm color on the page.

### Tertiary

- **Area tones** (`area-lagoon`, `area-ahi`, `area-ube`, `area-tileaf`, `area-lilikoi`, `area-reef`, `area-hibiscus`, `area-koa`, `area-slate`): one muted tone per area, in the order of the areas in `restaurants.md`. They fill the numbered place tokens, the map pins, and the small dot before each area heading. White numerals on the light tones and dark numerals on the night tones (`on-area-night`) all pass 4.5:1 contrast.

### Neutral

- **Deep Channel Ink** (`deep-channel-ink`): all primary text, the hotel pin, and the background of the map status message.
- **Weathered Teal Gray** (`weathered-teal-gray`): secondary text. Travel times, counts, field labels, and icons inside tonal buttons. It passes 4.5:1 on every neutral surface.
- **Shore Mist** (`shore-mist`): the page ground behind the masthead and the area groups.
- **Card White** (`card-white`): the area groups, map controls, popups, and clusters.
- **Foam** (`foam`): the tonal buttons for source links.
- **Hairline** (`hairline`): dividers between restaurants and the edge under the map.
- **Sea Glass** (`sea-glass`) and **Pale Sand Earth** (`pale-sand-earth`): the water and the land of the map. `map-theme.js` holds the full map palette.

### Named Rules

**The One Lagoon Rule.** Lagoon Teal is the only color that means "you can act here". Do not use any other hue for buttons, links, or focus.

**The Small Dots Rule.** Area tones appear only in circles of 28 px or less and in the 10 px heading dot. Never color a heading, a paragraph, or a button with an area tone.

**The Never Gray on Color Rule.** Text on Beach Sand uses Tidemark Ochre or Deep Channel Ink, never Weathered Teal Gray.

## Typography

**Display Font:** Atkinson Hyperlegible Next (with the Apple system font as fallback)
**Body Font:** Atkinson Hyperlegible Next
**Label Font:** Atkinson Hyperlegible Next

**Character:** One humanist sans that the Braille Institute designed for easy reading. It carries every role, from the title to the pin numerals. The steps between roles are small (about 1.15 to 1.2), so hierarchy comes from weight and space, not from size jumps.

### Hierarchy

- **Display** (700, 1.625rem, 1.15): the page title in the masthead only. Balanced wrap, maximum 20 characters per line.
- **Headline** (700, 1.25rem, 1.25): area headings, with the area dot in a hanging indent.
- **Title** (650, 1.0625rem, 1.3): restaurant names in the list and in map popups.
- **Body** (400, 1rem, 1.5): field values and notes in an open card. The page base is 1.0625rem.
- **Body summary** (400, 0.9375rem, 1.45): the food line in a closed card, clamped to 2 lines.
- **Meta** (500, 0.875rem to 0.9375rem, tabular numerals): travel times, counts, and the offline status.
- **Label** (600, 0.8125rem, 0.01em tracking, sentence case): field labels such as "Address" and "Good to know".
- **Button** (600, 0.9375rem, 1.25): buttons in cards. Map controls use 600 at 0.875rem.
- **Numeral** (700, 0.8125rem, tabular): numbers in place tokens, pins, and clusters.

### Named Rules

**The No Shouting Rule.** The heaviest weight is 700, and only the title and area headings use it. Restaurant names use 650. Never use 800 or uppercase text.

**The Legibility Floor Rule.** Text that people read is 16 px or larger. Only meta text, labels, and numerals go down to 13 px.

## Layout

The phone layout is one column. The masthead scrolls away. The map sticks to the top at 42% of the screen height (72% with "Larger map"). The list scrolls under it.

- The page gutter is 16 px. The masthead and the area headings add 4 px more, so the title and the headings start on the same line.
- Areas are 32 px apart. An area heading sits 10 px above its group. Each restaurant row has 14 px of padding at the top and 16 px at the sides.
- A row is a 3-column grid: a 28 px token, the text column, and a 20 px chevron, with 14 px between them. Dividers and the open details start at the text column (58 px from the group edge), so the numbers stay in a clean column.
- The page respects the iPhone safe areas at the top and bottom.
- At 60rem (960 px) and wider, the page becomes two columns: the list on the left (24rem to 34rem wide) and the full-height map on the right. The "Larger map" control is hidden.

**The Summary First Rule.** A closed card shows only the name, the travel time, and the food. All other fields wait behind a touch.

## Elevation & Depth

The list is flat. The map is the only layer that has depth. Things that float over the map (controls, popups, clusters, pins, and the status message) get a soft two-part shadow. The white area groups get only a faint shadow to separate them from the ground. In dark mode the shadows are darker and the surfaces step up in lightness from the ground.

### Shadow Vocabulary

- **Float** (`box-shadow: 0 1px 2px rgb(20 41 45 / 0.1), 0 6px 18px rgb(20 41 45 / 0.12)`): map controls, popups, clusters, and the status message.
- **Whisper** (`box-shadow: 0 1px 2px rgb(20 41 45 / 0.05)`): area groups on the ground.
- **Pin** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.28)`): single map pins.
- **Selected pin** (`box-shadow: 0 0 0 4px` the area tone at 30%, `0 2px 6px rgb(0 0 0 / 0.3)`): the pin of the open popup, scaled to 1.25.

### Named Rules

**The Float Over Map Rule.** Only elements that sit on top of the map cast a real shadow. Content in the list never floats.

## Shapes

The form language is round and soft. Every button is a capsule (999 px). Area groups have 20 px corners, popups 18 px, the status message 16 px, and note boxes 14 px. Place tokens, pins, and the area dot are full circles. The hotel pin is the only rounded square (9 px), so you can find it at once. There are no visible borders. Hairlines divide rows, and color fills separate surfaces.

**The Capsule Rule.** If you can touch it and it is a button, it is a capsule at least 44 px tall.

## Components

The components are soft and friendly: easy to touch, rounded, and quiet in color.

### Buttons

- **Shape:** capsule (999 px), at least 44 px tall.
- **Primary:** Lagoon Teal fill, white text, a 16 px stroke icon on the left ("Show on map" with a pin icon, "See details" in popups).
- **Tonal:** Foam fill, ink text, an external-link icon on the right in Weathered Teal Gray. Use it for source links.
- **Focus:** a 3 px Lagoon Teal outline, 2 px outside the shape.

### Map controls

- **Style:** a white capsule with the float shadow. "Show all" and "My location" share one capsule with a hairline divider. "Larger map" is its own capsule at the bottom left.
- **Icons:** 18 px strokes in Lagoon Teal before the label.
- **States:** "My location" turns gray and its icon pulses while the phone finds the location. The "Larger map" chevron turns over when the map is large.

### Area group (signature)

- **Corner style:** 20 px.
- **Background:** Card White on Shore Mist, with the whisper shadow.
- **Header:** the area heading with a 10 px tone dot in a hanging indent, and the place count on the right in meta type.

### Place row (signature)

- **Closed:** a tone token with the number, the name as a button, travel times with walk and drive icons, and the food line clamped to 2 lines. A chevron on the right.
- **Touch area:** the whole row opens and closes the card.
- **Open:** the details slide open (grid rows, 0.32 s ease out), and the chevron turns over. The fields show as label and value pairs. Then come the notes and the buttons.
- **Selected:** when the map popup for the place is open, the row gets a 10% wash of its area tone.
- **Focus:** a 3 px Lagoon Teal outline inside the row, with 14 px corners.

### Note box

- **Style:** Beach Sand fill, 14 px corners, Tidemark Ochre label, ink text.
- **Use:** only for fields whose label contains "post" or "comment".

### Map pins and clusters

- **Pin:** a 28 px circle in the area tone with a 2 px white ring and the place number.
- **Cluster:** a white capsule, 36 px tall, with the count in ink. When the hotel is in the group, a small house icon comes before the count.
- **Hotel pin:** a 28 px ink rounded square with a house icon.

### Offline status

- **Style:** meta text with a 16 px stroke icon, on the same line as the place count when it fits.
- **States:** a pulsing download arrow while the map saves, a Lagoon Teal check when the site is ready offline, and a crossed-out signal icon when the phone is offline.

### Icons

All icons are drawn on a 24 px grid with round caps and joins: 1.75 px strokes, or 1.9 px at 16 px size. They are inline SVG. Never use emoji or text symbols as icons.

## Do's and Don'ts

### Do:

- **Do** use Lagoon Teal for every action, the address link, and focus, and for nothing else.
- **Do** keep area tones in the 28 px tokens and pins and the 10 px heading dot.
- **Do** keep reading text at 16 px or larger and all text at WCAG AA contrast in light and dark.
- **Do** make every touch target at least 44 px tall.
- **Do** show the name, the travel time, and the food first, and put everything else behind a touch.
- **Do** use the Beach Sand note box for what the poster and the commenters said.
- **Do** keep the map palette in `map-theme.js` in step with the page colors in both appearances.
- **Do** keep motion short (0.2 s to 0.32 s, ease out) and turn it off for reduced motion.

### Don't:

- **Don't** return to bright cyan map water (#80deea) or saturated area colors on headings and buttons.
- **Don't** use a font weight above 700 or uppercase text.
- **Don't** use a colored bar on the left side of a note. Use the tinted note box.
- **Don't** put shadows on content in the list. Shadows are for things that float over the map.
- **Don't** use gray text on Beach Sand or on an area tone.
- **Don't** use emoji or text symbols as icons.
