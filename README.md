
# LockedIn – Anleitung zum Testen

## Am PC im Browser testen
1. Alle Dateien in einen Ordner entpacken.
2. Terminal in diesem Ordner öffnen und ausführen:
   ```
   python3 -m http.server 8000
   ```
3. Im Browser öffnen: `http://localhost:8000`

(Direktes Doppelklicken auf `index.html` reicht NICHT aus – der Service Worker
und das Manifest funktionieren nur über einen echten Server, nicht über
`file://`.)

## Auf dem Handy installieren
Damit du sie "wie eine App" installieren kannst, muss sie über **https**
erreichbar sein (nicht nur im lokalen WLAN). Kostenlose Optionen dafür:

- **GitHub Pages** – Ordner in ein GitHub-Repo laden, Pages aktivieren
- **Netlify Drop** (https://app.netlify.com/drop) – Ordner per Drag & Drop
  hochladen, sofort eine https-URL bekommen

Danach auf dem Handy:
- **Android (Chrome):** Seite öffnen → Menü (⋮) → "Zum Startbildschirm
  hinzufügen"
- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → "Zum Home-Bildschirm"

Ab dann startet LockedIn wie eine normale App, mit eigenem Icon, ohne
Browser-Leiste, und merkt sich deine Gewohnheiten auch offline.

## Projektstruktur
- `index.html` – Grundgerüst der Seite
- `style.css` – gesamtes Design
- `app.js` – Logik (Speichern, Abhaken, Streaks berechnen)
- `manifest.json` – macht die App installierbar
- `sw.js` – Service Worker, sorgt für Offline-Funktion
- `icon-192.png` / `icon-512.png` – App-Icons

## Nächste Ausbaustufen (Ideen)
- Erinnerungs-Benachrichtigungen
- Statistik-Seite (z. B. Erfolgsquote pro Woche)
- Eigene Icons pro Gewohnheit
- Später: Cloud-Speicherung mit Login, falls mehrere Geräte gewünscht sind


