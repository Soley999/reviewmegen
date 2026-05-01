# ReviewMeGen

> Turn any lecture file into a clean, study-ready reviewer in seconds.

![License](https://img.shields.io/badge/license-ISC-blue)
![Status](https://img.shields.io/badge/status-in%20development-orange)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite-61DAFB)

---

## What is ReviewMeGen?

**ReviewMeGen** is a full-stack web app that helps students study smarter. Upload any lecture file — PDF, DOCX, or TXT — and get a structured reviewer instantly, including summaries, key concepts, flashcards, and practice questions.

---

## Features

- 📄 **File Upload** — supports PDF, DOCX, and TXT formats
- 📝 **Short + Detailed Summaries** — quick overview and in-depth breakdown
- 🔑 **Key Concepts & Definitions** — auto-extracted terms and meanings
- 🃏 **Flashcards** — swipeable cards for fast review
- ❓ **Q&A Mode** — question and answer format for self-testing
- 📋 **Outline Format** — structured topic breakdown
- 🎯 **Difficulty Control** — adjust practice question difficulty level
- 🔍 **Search Inside Reviewers** — find important concepts fast with built-in highlighting
- 💾 **Dashboard** — save and manage all your generated reviewers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Version Control | Git + GitHub |
| Deployment | Vercel *(planned)* |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Soley999/reviewmegen.git

# Navigate into the project
cd reviewmegen

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
reviewmegen/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── assets/         # Images and static files
│   └── main.jsx        # App entry point
├── public/             # Static public assets
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## How It Works

1. **Upload** — Select your subject, tags, and difficulty level, then upload your file
2. **Generate** — The system summarizes and builds practice questions automatically
3. **Study** — Download your reviewer as PDF or save it to your dashboard

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable production-ready code |
| `development` | Active development and new features |

---

## Roadmap

- [ ] File upload with drag-and-drop
- [ ] AI-powered summary generation
- [ ] Flashcard viewer
- [ ] Q&A practice mode
- [ ] PDF export
- [ ] User authentication
- [ ] Dashboard with saved reviewers
- [ ] Mobile responsive design

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request to `development`

---

## Author

**Soley** — [@Soley999](https://github.com/Soley999)

---

## License

This project is licensed under the **ISC License**.
