# ML — Interactive Textbook

An interactive digital textbook for **Machine Learning**, organised the way the subject actually divides: by how much supervision the data provides, and by what kind of answer you want back.

Fourteen chapters across four modules, four live visualizers, a graded question bank with worked solutions, and a full glossary.

## Structure

| Module | Chapters |
|---|---|
| 1 — Foundations | 01 The machine-learning framework |
| 2 — Supervised: Regression | 02 Linear regression and gradient descent · 03 Regression metrics · 04 Bias, variance and regularisation |
| 3 — Supervised: Classification | 05 Logistic regression · 06 Naive Bayes · 07 Decision trees · 08 K-Nearest neighbours · 09 Classification metrics · 10 Support vector machines |
| 4 — Unsupervised: Clustering | 11 k-Means · 12 DBSCAN · 13 OPTICS · 14 Hierarchical clustering |

## The taxonomy

The subject divides first by supervision, then by output type:

- **Supervised** — features *and* labels
  - **Regression** → a continuous number (linear, Ridge, Lasso, Elastic Net)
  - **Classification** → a discrete label (logistic regression, naive Bayes, decision trees, KNN, SVM)
- **Unsupervised** — features only
  - **Clustering** → groups (k-means, DBSCAN, OPTICS, hierarchical)
  - **Dimensionality reduction** → not covered in this course
- **Reinforcement** → not covered in this course

Note the naming trap: **logistic regression is a classification algorithm**, despite the word "regression". It lives in Module 3.

## Dedicated clustering chapters

Chapters 11, 12 and 13 each get their own part with:

- full definitions and the objective being optimised
- the algorithm written out step by step, with pseudocode
- **two fully solved examples** each, with every distance and every arithmetic step shown
- parameter-choice guidance
- a comparison table against the other clustering methods
- two self-check quizzes with explanations

## Features

- **Pseudocode** for every algorithm, with complexity annotated
- **Four visualizers** — gradient descent, k-means stepper, metrics calculator, entropy explorer
- **Search** — press `/` or click the box; indexes every chapter and section heading
- **Progress tracking** — a *Mark this chapter complete* checkbox per chapter, stored in `localStorage`
- **Copy buttons** on every code block
- **Light and dark themes** driven by `prefers-color-scheme`
- **Print / export to PDF** — the print stylesheet hides navigation, expands collapsed sections and appends URLs to external links
- **Responsive** — the sidebar becomes a horizontal scroll bar below 1000px

## Architecture

```
.
├── index.html              Homepage, taxonomy and chapter dashboard
├── topics/                 14 chapter pages
├── visualizers.html        Interactive demos
├── practice.html           Question bank with worked solutions
├── glossary.html           Term reference
├── assets/
│   ├── style.css           All styling, light and dark, plus print
│   └── app.js              Search, progress, quizzes, visualizers
├── content/                Source fragments the pages are built from
└── build.py                Generator: wraps fragments in the page shell
```

To rebuild after editing content:

```bash
python3 build.py
```

## Dependencies

All three are loaded from CDN and all three degrade gracefully:

| Library | Used for | Fallback |
|---|---|---|
| Google Fonts (Newsreader, Public Sans, JetBrains Mono) | Typography | System serif / sans / mono |
| MathJax 3 | LaTeX equations | Equations appear as readable notation |
| Prism 1.29 | Syntax highlighting | Code appears unstyled but correct |

No build step, no framework, no npm. Static HTML, one CSS file and one JavaScript file.

## Scope

Built from the class notes of 27 August – 26 October 2026, with Alpaydin, *Introduction to Machine Learning* (2nd ed.) and Géron, *Hands-On Machine Learning* as references.

**Not covered:** ensemble methods (bagging, boosting, random forests), cross-validation and ROC curves, model selection, dimensionality reduction and PCA, and neural networks.

Sections marked **textbook-supplied** cover topics the notes name but never work out — logistic regression, Gini impurity, hierarchical clustering, OPTICS, Laplace smoothing and pruning.

## Verification

- All internal links and TOC anchors resolve
- Every page passes HTML tag-balance checks
- Every worked numerical was computed by hand and cross-checked
