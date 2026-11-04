#!/usr/bin/env python3
"""Build the ML interactive textbook from content fragments."""
import os, re, json, html

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, 'content')
TOPICS_DIR = os.path.join(ROOT, 'topics')
os.makedirs(TOPICS_DIR, exist_ok=True)

# (slug, num, title, short, keywords, module-key)
TOPICS = [
    ("01-framework", "01", "The Machine-Learning Framework",
     "What it means to learn from data, and how the whole subject divides.",
     "machine learning, supervised, unsupervised, reinforcement, train test split, workflow", "M1"),
    ("02-linear-regression", "02", "Linear Regression and Gradient Descent",
     "Fitting a line by minimising squared error, and how gradient descent finds the minimum.",
     "linear regression, hypothesis, cost function, gradient descent, learning rate, MSE", "M2"),
    ("03-regression-metrics", "03", "Regression Metrics",
     "MSE, MAE, RMSE and R-squared: what each one rewards and punishes.",
     "MSE, MAE, RMSE, R squared, coefficient of determination, SSres, SStot", "M2"),
    ("04-bias-variance", "04", "Bias, Variance and Regularisation",
     "Why a model that fits the training data perfectly can be worse than one that does not.",
     "bias, variance, underfitting, overfitting, regularisation, Lasso, Ridge, Elastic Net, L1, L2", "M2"),
    ("05-logistic-regression", "05", "Logistic Regression",
     "Turning a linear model into a classifier with the sigmoid and log-loss.",
     "logistic regression, sigmoid, log odds, decision boundary, log loss, cross entropy", "M3"),
    ("06-naive-bayes", "06", "Naive Bayes",
     "Classification by Bayes theorem under a deliberately naive independence assumption.",
     "naive bayes, Bayes theorem, prior, likelihood, posterior, evidence, Laplace smoothing", "M3"),
    ("07-decision-trees", "07", "Decision Trees",
     "Splitting the feature space by whichever question reduces impurity the most.",
     "decision tree, entropy, information gain, Gini impurity, ID3, pruning", "M3"),
    ("08-knn", "08", "K-Nearest Neighbours",
     "The laziest classifier there is: look at the neighbours and take a vote.",
     "KNN, k nearest neighbours, Euclidean distance, majority vote, lazy learner, curse of dimensionality", "M3"),
    ("09-classification-metrics", "09", "Classification Metrics",
     "The confusion matrix, and why accuracy alone can be dangerously misleading.",
     "confusion matrix, accuracy, precision, recall, F1, sensitivity, specificity", "M3"),
    ("10-svm", "10", "Support Vector Machines",
     "Finding the widest street between two classes, and the kernel trick for when a line will not do.",
     "SVM, support vector machine, hyperplane, margin, hard margin, soft margin, dual, kernel", "M3"),
    ("11-kmeans", "11", "k-Means Clustering",
     "Partitioning points into k groups by alternating assignment and centroid updates.",
     "k-means, clustering, centroid, Lloyd, SSE, elbow method, unsupervised", "M4"),
    ("12-dbscan", "12", "DBSCAN",
     "Density-based clustering: find dense regions and label the rest as noise.",
     "DBSCAN, density, eps, minPts, core point, border point, noise, clustering", "M4"),
    ("13-optics", "13", "OPTICS",
     "Ordering points by reachability so clusters of different densities all show up.",
     "OPTICS, reachability, core distance, ordering, density, clustering, variable density", "M4"),
    ("14-hierarchical", "14", "Hierarchical Clustering",
     "Building a nested tree of clusters bottom-up or top-down, and reading it as a dendrogram.",
     "hierarchical, agglomerative, divisive, dendrogram, linkage, single, complete, average, ward", "M4"),
]

MODULES = [
    ("M1", "Module 1", "Foundations"),
    ("M2", "Module 2", "Supervised Learning — Regression"),
    ("M3", "Module 3", "Supervised Learning — Classification"),
    ("M4", "Module 4", "Unsupervised Learning — Clustering"),
]

EXTRA_PAGES = [
    ("visualizers", "Interactive Visualizers", "Gradient descent, k-means, the metrics calculator and an entropy explorer."),
    ("practice", "Practice and Examination Questions", "Graded questions with full worked solutions."),
    ("glossary", "Glossary", "Every term used in the course, defined in one line."),
]

SEARCH = []


def parse_fragments():
    frags = {}
    if not os.path.isdir(CONTENT):
        return frags
    for fn in sorted(os.listdir(CONTENT)):
        if not fn.endswith('.html'):
            continue
        src = open(os.path.join(CONTENT, fn), encoding='utf-8').read()
        parts = re.split(r'<!--(TOPIC|PAGE):([^>]+?)-->', src)
        i = 1
        while i < len(parts) - 2:
            slug = parts[i + 1].split('|')[0].strip()
            frags[slug] = parts[i + 2].strip()
            i += 3
    return frags


def head(title, rel, page_id, description=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(title)} · ML Notes</title>
<meta name="description" content="{html.escape(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{rel}assets/style.css">
<script>
  window.MathJax = {{
    tex: {{ inlineMath: [['\\\\(', '\\\\)']], displayMath: [['\\\\[', '\\\\]']] }},
    options: {{ skipHtmlTags: ['script','noscript','style','textarea','pre','code'] }}
  }};
</script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css">
</head>
<body data-page="{page_id}">
<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="{rel}index.html">ML<span>.</span>Notes</a>
    <nav class="topnav">
      <a href="{rel}index.html">Home</a>
      <a href="{rel}topics/01-framework.html">Chapters</a>
      <a href="{rel}visualizers.html">Visualizers</a>
      <a href="{rel}practice.html">Practice</a>
      <a href="{rel}glossary.html">Glossary</a>
    </nav>
    <div class="searchbox">
      <input id="search-input" type="search" placeholder="Search topics…  ( / )" autocomplete="off" aria-label="Search the textbook">
      <div class="searchresults" id="search-results"></div>
    </div>
  </div>
</header>
"""


def sidebar(rel, current):
    out = ['<nav class="sidebar" aria-label="Chapter navigation">']
    for key, label, name in MODULES:
        out.append(f'<div class="side-group">{html.escape(name)}</div>')
        for slug, num, title, _s, _k, mod in TOPICS:
            if mod != key:
                continue
            cls = ' class="active"' if slug == current else ''
            out.append(f'<a href="{rel}topics/{slug}.html" data-topic-id="topic-{slug}"{cls}>{num} · {html.escape(title)}</a>')
    out.append('<div class="side-group">Tools</div>')
    for slug, title, _d in EXTRA_PAGES:
        cls = ' class="active"' if slug == current else ''
        out.append(f'<a href="{rel}{slug}.html"{cls}>{html.escape(title)}</a>')
    out.append('</nav>')
    return '\n'.join(out)


def checkbox(slug):
    return ('<label class="chapter-check">'
            f'<input type="checkbox" data-complete="topic-{slug}" aria-label="Mark this chapter complete">'
            '<span class="cc-text">Mark this chapter complete</span></label>')


def pager(rel, idx):
    if idx is None:
        return ''
    prev_t = TOPICS[idx - 1] if idx > 0 else None
    next_t = TOPICS[idx + 1] if idx < len(TOPICS) - 1 else None
    out = ['<nav class="pager" aria-label="Chapter navigation">']
    if prev_t:
        out.append(f'<a href="{rel}topics/{prev_t[0]}.html"><span class="dir">← Previous</span><span class="ttl">{prev_t[1]} · {html.escape(prev_t[2])}</span></a>')
    else:
        out.append('<span style="flex:1"></span>')
    if next_t:
        out.append(f'<a class="next" href="{rel}topics/{next_t[0]}.html"><span class="dir">Next →</span><span class="ttl">{next_t[1]} · {html.escape(next_t[2])}</span></a>')
    else:
        out.append('<a class="next" href="' + rel + 'practice.html"><span class="dir">Next →</span><span class="ttl">Practice and examination questions</span></a>')
    out.append('</nav>')
    return '\n'.join(out)


TAIL_IDX = None


def tail(rel, search_json):
    return f"""{pager(rel, TAIL_IDX)}
<footer style="margin-top:56px;padding-top:22px;border-top:1px solid var(--rule);font-size:13px;color:var(--ink-3)">
  <p style="margin:0 0 6px"><strong style="color:var(--ink-2)">Machine Learning</strong> — an interactive textbook built from the class notes of 27 Aug – 26 Oct 2026, with Alpaydin and Géron as references.</p>
  <p style="margin:0">Progress is saved in this browser only. <a href="{rel}glossary.html">Glossary</a> · <a href="{rel}practice.html">Practice</a> · <a href="{rel}visualizers.html">Visualizers</a></p>
</footer>
</main>
</div>
<script>window.ML_SEARCH = {search_json};</script>
<script src="{rel}assets/app.js"></script>
</body>
</html>
"""


def build():
    global TAIL_IDX
    frags = parse_fragments()

    for slug, num, title, short, kw, _m in TOPICS:
        SEARCH.append({"title": f"{num} · {title}", "topic": "Chapter", "url": f"topics/{slug}.html", "keywords": kw + " " + short})
    for slug, title, desc in EXTRA_PAGES:
        SEARCH.append({"title": title, "topic": "Tool", "url": f"{slug}.html", "keywords": desc})
    for slug, num, title, _s, _k, _m in TOPICS:
        body = frags.get(slug, '')
        for m in re.finditer(r'<h2[^>]*id="([^"]+)"[^>]*>(.*?)</h2>', body, re.S):
            text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
            SEARCH.append({"title": text, "topic": f"Ch {num}", "url": f"topics/{slug}.html#{m.group(1)}", "keywords": text})

    search_json = json.dumps(SEARCH, ensure_ascii=False)
    written = []

    for idx, (slug, num, title, short, _kw, _m) in enumerate(TOPICS):
        body = frags.get(slug)
        if body is None:
            print(f"  !! missing fragment for {slug}")
            continue
        TAIL_IDX = idx
        doc = head(f"{num} · {title}", "../", f"topic-{slug}", short)
        doc += '<div class="shell">\n' + sidebar("../", slug) + '\n<main>\n'
        doc += f'<div class="kicker">Chapter {num}</div>\n<h1>{html.escape(title)}</h1>\n'
        doc += f'<p class="lede">{html.escape(short)}</p>\n'
        doc += checkbox(slug) + '\n'
        doc += body + '\n'
        doc += tail("../", search_json)
        p = os.path.join(TOPICS_DIR, f"{slug}.html")
        open(p, 'w', encoding='utf-8').write(doc)
        written.append(p)

    for slug, title, desc in EXTRA_PAGES:
        body = frags.get(slug)
        if body is None:
            print(f"  !! missing page fragment for {slug}")
            continue
        TAIL_IDX = None
        doc = head(title, "", slug, desc)
        doc += '<div class="shell">\n' + sidebar("", slug) + '\n<main>\n'
        doc += f'<div class="kicker">Tool</div>\n<h1>{html.escape(title)}</h1>\n'
        doc += f'<p class="lede">{html.escape(desc)}</p>\n'
        doc += body + '\n'
        doc += tail("", search_json)
        p = os.path.join(ROOT, f"{slug}.html")
        open(p, 'w', encoding='utf-8').write(doc)
        written.append(p)

    TAIL_IDX = None
    home = head("Interactive Textbook", "", "home", "An interactive textbook for Machine Learning.")
    home += '<div class="shell">\n' + sidebar("", "home") + '\n<main style="max-width:1000px">\n'
    home += frags.get('home', '<p>Home content missing.</p>') + '\n'
    home += f"""<footer style="margin-top:56px;padding-top:22px;border-top:1px solid var(--rule);font-size:13px;color:var(--ink-3)">
  <p style="margin:0">Built from the class notes of 27 Aug – 26 Oct 2026. Material that the notes name but never work out is marked as textbook-supplied.</p>
</footer>
</main>
</div>
<script>window.ML_SEARCH = {search_json};</script>
<script src="assets/app.js"></script>
</body>
</html>
"""
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(home)
    written.append(os.path.join(ROOT, 'index.html'))

    print(f"built {len(written)} pages, {len(SEARCH)} search entries")


if __name__ == '__main__':
    build()
