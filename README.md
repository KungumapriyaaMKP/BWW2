# Royal Wedding Invitation | Sivani and Abhishek

A bespoke luxury wedding website crafted from the physical wedding invitation card of **Sivani Ahilan Annalakshmi** and **Abhishek Krishna SS**, celebrating their wedding union on **December 14, 2026** at **The Royal Mahal, Trichy**.

---

## Design System and Heritage Aesthetic

- **Theme Palette**: Deep royal velvet maroon (`#1a0207`, `#28040d`, `#3a0614`), authentic Pichwai lotus emerald greens, and rich antique gold foil accents (`#d4af37`, `#f6e19c`).
- **Typography**: Classical editorial titles using Cinzel, poetic prose in Cormorant Garamond, clean accents in Montserrat, and sacred verses in Noto Serif Tamil.
- **Authentic Motifs**:
  - Gold filigree "S and A" royal monogram crest extracted from the physical card.
  - Traditional Pichwai crimson red lotuses and water lily leaves flanking the main invitation card.
  - Classical decorative gold flourishes.
  - High-resolution scanned QR codes for direct venue navigation.
- **Strict Guidelines Observed**:
  - Strictly **no em dashes** across all HTML, CSS, JavaScript, and metadata.
  - Strictly **no emojis**; all visual accents utilize crisp SVG vector paths and authentic heritage motifs.

---

## Interactive Features

1. **Royal Entrance Experience**:
   - Monogram crest presentation on deep maroon lotus pattern with an "Enter Celebration" entrance trigger that smoothly launches the traditional wedding audio track.
2. **Cinematic Video Scroll Animation Engine**:
   - Pinned HTML5 Canvas scrubbing through high-resolution frames with sub-frame interpolation on scroll.
   - Narrative story captions fading in and out at choreographed scroll checkpoints.
   - Seamless transition into the wedding invitation card once the animation concludes.
3. **Bespoke Digital Wedding Card**:
   - True digital reproduction of the physical card with crisp web typography, parentage details, auspicious timing, and Pichwai lotus artwork flanks.
4. **Live Muhurtham Countdown**:
   - Real-time countdown to December 14, 2026, 9:15 AM IST, displaying days, hours, minutes, and seconds alongside traditional astrological panchangam details.
5. **Sacred Ceremonies Itinerary**:
   - The Engagement (December 13, 2026, 7:00 PM at The Royal Mahal, Trichy).
   - The Wedding Muhurtham (December 14, 2026, 9:15 AM to 10:15 AM at The Royal Mahal, Trichy).
   - The Grand Reception (December 17, 2026, 6:30 PM at Al Saj Gravity, Trivandrum).
   - Instant "Add to Calendar" button generating RFC-compliant `.ics` files.
6. **Venue Directions and Scanned QR Codes**:
   - Interactive destination cards with scanned QR codes linking to Google Maps navigation (`qrto.org/TxUEkm` and `qrto.org/qVX17c`).
7. **Traditional Tamil Patrikai (சிவமயம்)**:
   - Dedicated section honoring the Tamil sacred invitation text from Page 5 of the card with deity invocations and ancestral lineages.
8. **RSVP and Blessings Wall**:
   - Interactive guest RSVP form with persistent `localStorage` blessings feed and gold toast notifications.
9. **Ambient Wedding Music Player**:
   - Classical shehnai and sitar instrumental audio with a gold floating equalizer bar toggle button.

---

## Video Frame Extractor Utility

To load a new video into the scroll animation:

1. Place your video file inside the project directory or specify its file path.
2. Run the extraction utility:
   ```bash
   python tools/extract_frames.py path/to/your_video.mp4
   ```
3. The script will automatically:
   - Sample the frames smoothly.
   - Generate optimized WebP sets for desktop (1920w) and mobile (960w).
   - Update `frames/manifest.json` with the exact frame count and dimensions.
   - The web app will instantly read the new frame count and render the new video seamlessly on scroll.
