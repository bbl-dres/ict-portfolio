# IKT Projektportfolio DRES

<p align="center">
  <img src="assets/Social1.jpg" alt="IKT Projektportfolio DRES" width="100%">
</p>

![HTML](https://img.shields.io/badge/HTML-Static_SPA-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-Custom_Tokens-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

> [!CAUTION]
> **This is an unofficial mockup for demonstration purposes only.**
> All data is fictional. Not all features are fully functional. This project serves as a visual and conceptual prototype — it is not intended for production use.

Portfolio management tool for the ICT division at DRES (Bundesamt fur Bauten und Logistik BBL). Built as a static single-page application — no build step, no dependencies.

## Views

<p align="center">
  <img src="assets/Preview1.jpg" alt="Gallery View" width="45%">
  &nbsp;&nbsp;
  <img src="assets/Preview2.jpg" alt="List View" width="45%">
</p>

| View | Description |
|------|-------------|
| **Galerie** | Card grid with thumbnails, badges, and key metadata |
| **Liste** | Sortable data grid with configurable columns |
| **Kanban** | Phase-based board with drag-and-drop |
| **Gantt** | Timeline with bars colored by project class |
| **Dashboard** | KPI cards and bar charts for phase/budget distribution |

## Features

- Multi-dimensional filtering (phase, class, type, priority, responsible, tags, DTI)
- Filter by clicking any badge in any view
- Grouping by any dimension with collapsible sections
- Drag-and-drop between kanban columns and groups
- URL state persistence (bookmarkable filtered/sorted views)
- CSV and PDF export
- Detail view with overview, comments, and changelog tabs

## Project Structure

```
index.html          Single HTML entry point
css/
  tokens.css        Design tokens (colors, spacing, typography, shadows)
  styles.css        Component styles
js/
  state.js          Global state and label/icon constants
  data.js           Data loading, filtering, sorting, grouping, formatting
  app.js            Rendering, event delegation, UI logic
data/
  projects.json     Project records
  users.json        User profiles
  comments.json     Project comments
  changelog.json    Field change history
assets/
  swiss-logo-flag.svg
```

## Running Locally

Serve the project root with any static file server:

```bash
npx serve .
# or
python -m http.server
```

Open `http://localhost:3000` (or `:8000` for Python).

## License

See [LICENSE](LICENSE).
