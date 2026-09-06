# 🇮🇳 Pan-India Music Database (Open Source)

An open-source, community-driven database mapping official dubbed song versions for Indian Pan-India movies across regional languages (**Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, etc.**) strictly on JioSaavn at 320kbps.

---

## 🌟 Why this exists?
Pan-India movies (like *RRR, Pushpa, KGF, Salaar, Kalki, Baahubali, Coolie*) release their soundtracks across multiple regional languages.
However, song titles, playback singers, durations, and album track order differ completely across dubs:
- *Hindi:* **Sholay** (Track #6)
- *Telugu:* **Etthara Jenda** (Track #6)
- *Tamil:* **Koole** (Track #6)
- *Kannada:* **Etthuva Jenda** (Track #6)
- *Malayalam:* **Etthuka Jenda** (Track #6)

This repository provides pre-verified, high-precision mapping so any music streaming app can fetch dubbed versions instantly in **< 5ms** without heavy API searches or audio processing!

---

## ⚡ CDN Usage (Unlimited & Zero Rate Limit)
You can directly fetch any movie mapping via **jsDelivr CDN**:

```http
GET https://cdn.jsdelivr.net/gh/prosperity-music/pan-india-music-db@main/movies/{movie_slug}.json
```

Example for RRR:
`https://cdn.jsdelivr.net/gh/prosperity-music/pan-india-music-db@main/movies/rrr.json`

---

## 📁 Repository Structure
```
pan-india-music-db/
  ├── schema.json               # JSON Schema definition
  ├── README.md                 # Documentation & Contribution Guide
  └── movies/                   # Movie mappings (one file per movie)
        ├── rrr.json
        ├── pushpa.json
        ├── pushpa_2.json
        ├── devara_part_1.json
        ├── jailer_2.json
        ├── ala_bolelo.json
        ├── coolie.json
        └── baahubali_2_the_conclusion.json
```

---

## 🧠 How App Generates Movie Slugs (`movie_slug.json`)

The Prosperity Music app computes file names deterministically from movie/album titles using the following normalization algorithm (`toMovieSlug`):

1. **Remove HTML entities**: `&quot;` -> `"`, `&amp;` -> `&`, `&#039;` -> `'`
2. **Strip Language Qualifiers**: e.g., `(Telugu)`, `(Tamil)`, `[Hindi]`, `(Original Soundtrack)`, `[Malayalam]`
3. **Strip Music Album Buzzwords**: `Original Motion Picture Soundtrack`, `OST`, `Single`, `Album`, `Audio`, `Video`, `BGM`, `Full Song`
4. **Normalize Dots in Acronyms**: `R.R.R.` -> `RRR`, `K.G.F.` -> `KGF`
5. **Normalize Parts & Chapters**: `Part 1` -> `part_1`, `Chapter 2` -> `chapter_2`
6. **Replace Special Characters with Underscore**: Convert non-alphanumeric characters to `_`, convert multiple `___` to single `_`, and trim leading/trailing underscores.
7. **Lowercased string**: All slugs are 100% lowercase.

### 📌 Slugging Conversion Reference Table

| Raw Album / Movie Title in JioSaavn | Generated Slug (`{movie_slug}.json`) |
| :--- | :--- |
| `Coolie (Tamil)` | `coolie.json` |
| `Coolie (Original Motion Picture Soundtrack)` | `coolie.json` |
| `Pushpa 2 The Rule (Hindi)` | `pushpa_2.json` |
| `R.R.R.` / `RRR (Telugu)` | `rrr.json` |
| `K.G.F: Chapter 2` | `kgf_chapter_2.json` |
| `Baahubali 2 - The Conclusion` | `baahubali_2_the_conclusion.json` |
| `Salaar: Part 1 - Ceasefire` | `salaar.json` |
| `Devara: Part 1` | `devara_part_1.json` |
| `Jailer 2` | `jailer_2.json` |

---

## 🎵 How App Generates Song Slugs (`song_slug`)

Inside each movie JSON, every song has a `slug` generated from its canonical title:
```dart
songSlug = canonicalTitle.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '_').replaceAll(RegExp(r'_+'), '_');
```
*Example:* `"Deva's 3 Minute Monologue"` -> `deva_s_3_minute_monologue`  
*Example:* `"Powerhouse"` -> `powerhouse`

---

## 📋 Standard Movie JSON Template (Copy & Paste Reference)

If you ever need to manually create or repair a movie file in `movies/{movie_slug}.json`, you can copy this template directly:

```json
{
  "movie": "Coolie",
  "movie_slug": "coolie",
  "year": 2025,
  "languages": [
    "hindi",
    "tamil",
    "telugu",
    "kannada",
    "malayalam"
  ],
  "songs": [
    {
      "slug": "powerhouse",
      "canonical_title": "Powerhouse",
      "approx_duration_sec": 240,
      "contributed_by": "username",
      "versions": {
        "hindi": {
          "title": "Powerhouse (Hindi)",
          "id": "JIOSAAVN_ID_HERE",
          "duration_sec": 240,
          "singers": "Singer Name",
          "album": "Coolie (Hindi)"
        },
        "tamil": {
          "title": "Powerhouse (Tamil)",
          "id": "JIOSAAVN_ID_HERE",
          "duration_sec": 240,
          "singers": "Singer Name",
          "album": "Coolie (Tamil)"
        },
        "telugu": {
          "title": "Powerhouse (Telugu)",
          "id": "JIOSAAVN_ID_HERE",
          "duration_sec": 240,
          "singers": "Singer Name",
          "album": "Coolie (Telugu)"
        },
        "kannada": {
          "title": "Powerhouse (Kannada)",
          "id": "JIOSAAVN_ID_HERE",
          "duration_sec": 240,
          "singers": "Singer Name",
          "album": "Coolie (Kannada)"
        },
        "malayalam": {
          "title": "Powerhouse (Malayalam)",
          "id": "JIOSAAVN_ID_HERE",
          "duration_sec": 240,
          "singers": "Singer Name",
          "album": "Coolie (Malayalam)"
        }
      }
    }
  ]
}
```

### Key Field Descriptions:
- **`movie`**: Clean movie name with proper capitalization (e.g. `"Coolie"`).
- **`movie_slug`**: The file name without `.json` (e.g. `"coolie"`).
- **`languages`**: Array of all regional languages available in this movie.
- **`songs`**: Array of multi-language song mappings.
- **`songs[].slug`**: Normalized snake_case song slug.
- **`songs[].canonical_title`**: Display title of the track.
- **`songs[].approx_duration_sec`**: Song length in seconds (used to prevent mismatch with remixes/dialogues).
- **`songs[].contributed_by`**: (Optional) Contributor's GitHub/community username.
- **`versions`**: Map of language name (lowercase: `hindi`, `tamil`, `telugu`, `kannada`, `malayalam`) to track details.
- **`versions.<lang>.id`**: Raw JioSaavn track ID (e.g. `cQJ-3b4P` - without `jio_` prefix).
- **`versions.<lang>.canvas_url`**: (Optional) Spotify Canvas MP4 loop URL for background video playback.

---

## 🤝 How to Contribute a New Movie
1. Fork this repository.
2. Create a new file in `movies/<movie_slug>.json` following the naming rule above.
3. Follow the schema above or in `schema.json`.
4. Ensure song IDs are valid JioSaavn 320kbps IDs.
5. Submit a Pull Request! 🎉
