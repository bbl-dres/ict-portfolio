# IKT Projektportfolio DRES

<p align="center">
  <a href="https://bbl-dres.github.io/ict-portfolio/">
    <img src="assets/social-preview.jpg" alt="IKT Projektportfolio DRES" width="100%">
  </a>
</p>

[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f?logo=github&logoColor=white)](https://bbl-dres.github.io/ict-portfolio/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> [!CAUTION]
> Unofficial prototype for demonstration only. The data is fictional and not every feature is fully functional.

Static portfolio-management prototype for the ICT division at DRES (Bundesamt für Bauten und Logistik BBL).

## Demo

**Live demo:** https://bbl-dres.github.io/ict-portfolio/

<p align="center">
  <img src="assets/preview-1.jpg" alt="IKT project portfolio gallery" width="49%" align="top"/>
  <img src="assets/preview-2.jpg" alt="IKT project portfolio Gantt view" width="49%" align="top"/>
</p>

## Features

- Gallery, list, and kanban views for ICT projects.
- Filtering, sorting, grouping, and click-to-filter tags.
- Shareable URLs that preserve the current view and filters.
- Project details with comments and change history.
- CSV and PDF exports.

## Run locally

```bash
python -m http.server 8000
```

Open <http://localhost:8000/>.

## Documentation

- [Data model](docs/DATAMODEL.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Wireframes](docs/WIREFRAME.md)

## License

[MIT License](LICENSE).
