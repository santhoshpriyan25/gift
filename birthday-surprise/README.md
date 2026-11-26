# 🎀 Birthday Surprise Website

A dreamy, interactive birthday gift for your best friend. Pure HTML + CSS + JavaScript, so there is nothing to install. Fonts and icons are bundled locally, so it also works offline.

## ▶️ How to run it

**Easiest:** double-click `index.html`. It opens in your browser.

**Better for sharing with her (a link she can open on her phone):**
- Drag this whole folder onto <https://app.netlify.com/drop> (free, takes 30 seconds), or
- Upload it to GitHub Pages / Vercel / Cloudflare Pages.

**Local server (optional):** `python3 -m http.server 8000` inside this folder, then open <http://localhost:8000>.

## ✏️ How to personalise it

Everything personal lives in **`js/config.js`**. Open it in any text editor (Notepad is fine) and change the text between the quotes.

| What | Where in `config.js` |
|---|---|
| Her name / your name | `friendName`, `yourName` |
| Message after blowing the candles | `candleWishTitle`, `candleWish` |
| The personal letter | `letterTitle`, `letter` |
| Photos + captions | `photos` |
| "Why you are special" cards (add as many as you like) | `reasons` |
| Final surprise message + special memories | `secretTitle`, `secretMessage`, `memories` |
| Closing message / signature | `closingMessage`, `closingSign` |
| Background music | `music.file` |

Tip: write `{friend}` or `{me}` inside any text and it turns into the names automatically.

### 📸 Adding or changing photos
1. Copy your image into `assets/photos/` (JPG/PNG/WebP).
2. Add or edit a line in `photos` in `config.js`:
   `{ src: "assets/photos/our-trip.jpg", caption: "Our best trip ✈️" },`
3. Delete a line to remove a photo. Keep each photo under about 1.5 MB for fast loading.

### 🎵 Music
- By default a built-in music-box "Happy Birthday" tune plays, so it works with no files.
- For your own song, put an `.mp3` in `assets/music/` and set `music: { file: "assets/music/our-song.mp3", volume: 0.5 }`.
- Music only starts after she taps something (browsers require this), and there is always a floating play/pause button.
- If the mp3 is missing or broken, it falls back to the built-in tune.

## 🗂️ Project structure
```
index.html          page structure
css/style.css       all the styling and animations
js/config.js        ✏️ YOUR messages, names, photos
js/app.js           interactions (no need to edit)
js/icons.js         bundled Lucide icons
assets/photos/      your photos
assets/music/       your music
assets/fonts/       local fonts
```

## ✨ What's inside
Loading screen → gift box → birthday cake with blowable candles and poppable balloons → typed letter in an envelope → polaroid gallery with lightbox (swipe or arrow keys) → flip cards → memory game → locked secret with fireworks → final wish and replay. A progress bar tracks 7 discoveries. Custom sparkle cursor on desktop; normal touch on mobile.

Happy gifting! 💗
