# Block Strike: a mobile-first Three.js FPS

Static files only (no build). Three.js, PeerJS and Firebase load from CDNs.

## Firebase login (required)
1. console.firebase.google.com: create a project, add a Web app, copy its config into `firebase-config.js`.
2. Build > Authentication > Sign-in method: enable **Email/Password** and **Google**.
3. Authentication > Settings > Authorized domains: add `<user>.github.io` (and `localhost` for testing).

## Run locally
    python3 -m http.server 8000   # open http://localhost:8000 (phone: use your computer's LAN IP, or deploy)

## Deploy to GitHub Pages
Push this folder's contents to a repo (`index.html` at root), then Settings > Pages > Deploy from branch > `main` / root.

## Mobile
Landscape only: a "rotate your phone" screen covers portrait, and Android Chrome is also locked to landscape via fullscreen. iOS Safari can't lock orientation, so use Share > Add to Home Screen for the fullscreen landscape app.
Controls: left thumb = move (floating stick), right thumb drag = look, Fire / Jump / Reload / Scope buttons, 1-5 weapon buttons top-right. Text selection and the long-press menu are disabled.
Desktop still works: WASD, mouse, 1-5, R, right-click to scope.

## Modes
Offline 5v5 vs bots (round elimination). Online 1v1: one player hosts and shares the ID, the other joins (PeerJS).
