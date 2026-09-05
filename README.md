# 🇮🇳 Pan-India Music Database (Open Source)

An open-source, community-driven database mapping official dubbed song versions for Indian Pan-India movies across regional languages (**Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, etc.**) strictly on JioSaavn at 320kbps.

---

## 🌟 Why this exists?
Pan-India movies (like *RRR, Pushpa, KGF, Salaar, Kalki, Baahubali*) release their soundtracks across multiple regional languages.
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
GET https://cdn.jsdelivr.net/gh/<owner>/pan-india-music-db@main/movies/{movie_slug}.json
```

Example for RRR:
`https://cdn.jsdelivr.net/gh/<owner>/pan-india-music-db@main/movies/rrr.json`

---

## 📁 Repository Structure
```
pan-india-music-db/
  ├── schema.json               # JSON Schema definition
  ├── README.md                 # Documentation & Contribution Guide
  └── movies/                   # Movie mappings (one file per movie)
        ├── rrr.json
        ├── pushpa_the_rise.json
        ├── pushpa_the_rule.json
        ├── kgf_chapter_1.json
        ├── kgf_chapter_2.json
        ├── salaar.json
        ├── kalki_2898_ad.json
        ├── jawan.json
        ├── animal.json
        ├── vikram.json
        ├── coolie.json
        └── baahubali_the_beginning.json
```

---

## 🤝 How to Contribute a New Movie
1. Fork this repository.
2. Create a new file in `movies/<movie_slug>.json` (lowercase, underscore separated, e.g. `devara_part_1.json`).
3. Follow the schema in `schema.json`.
4. Ensure song IDs are valid JioSaavn 320kbps IDs.
5. Submit a Pull Request! 🎉
