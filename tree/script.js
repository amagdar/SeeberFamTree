
async function loadData() {
  const res = await fetch('data.json');
  return res.json();
}

function personSpan(name) {
  const span = document.createElement('span');
  span.className = 'person';
  span.textContent = name;
  span.dataset.name = name.toLowerCase();
  span.addEventListener('click', () => showCard(name));
  return span;
}

function buildNode(node, depth = 0) {
  const details = document.createElement('details');
  if (depth < 1) details.open = true;
  const summary = document.createElement('summary');

  // Summary line
  const title = document.createElement('span');
  title.textContent = node.label || (node.people ? node.people.join(' & ') : '');
  summary.appendChild(title);

  if (node.notes) {
    const meta = document.createElement('span');
    meta.className = 'node-meta';
    meta.textContent = ` — ${node.notes}`;
    summary.appendChild(meta);
  }
  details.appendChild(summary);

  if (node.spouses) {
    const sp = document.createElement('div');
    sp.className = 'node-meta';
    sp.textContent = 'Spouses: ';
    node.spouses.forEach(s => {
      sp.appendChild(personSpan(s.name));
      if (s.notes) {
        const n = document.createElement('span');
        n.className = 'node-meta';
        n.textContent = ` (${s.notes})`;
        sp.appendChild(n);
      }
      sp.appendChild(document.createTextNode('  '));
    });
    details.appendChild(sp);
  }

  // People listed
  if (node.people) {
    const wrap = document.createElement('div');
    wrap.className = 'node-meta';
    wrap.textContent = 'People: ';
    node.people.forEach(p => { wrap.appendChild(personSpan(p)); wrap.appendChild(document.createTextNode('  ')); });
    details.appendChild(wrap);
  }

  // Link to cross-branch anchor
  if (node.link) {
    const a = document.createElement('a');
    a.className = 'node-meta';
    a.href = node.link;
    a.textContent = '↗ cross-branch link';
    details.appendChild(a);
  }

  if (node.children && node.children.length) {
    node.children.forEach(ch => details.appendChild(buildNode(ch, depth + 1)));
  }

  if (node.anchor) {
    const anch = document.createElement('div');
    anch.id = node.anchor;
    details.appendChild(anch);
  }

  return details;
}

function renderBranch(branch) {
  const tree = document.getElementById('tree');
  tree.innerHTML = '';
  const heading = document.createElement('h2');
  heading.textContent = branch.title;
  tree.appendChild(heading);
  tree.appendChild(buildNode(branch.root));
}

function showCard(name) {
  const card = document.getElementById('cardContent');
  card.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = name; card.appendChild(h);
  const p = document.createElement('p');
  p.textContent = 'Click other names in the tree to navigate marriages and children. Cross-branch links appear as ↗.';
  card.appendChild(p);
}

function setupTabs(data) {
  const nav = document.getElementById('branchTabs');
  data.branches.forEach((b, i) => {
    const btn = document.createElement('button');
    btn.textContent = b.id.charAt(0).toUpperCase() + b.id.slice(1);
    btn.addEventListener('click', () => {
      nav.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      renderBranch(b);
    });
    if (i === 0) btn.classList.add('active');
    nav.appendChild(btn);
  });
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  input.addEventListener('input', () => {
    const term = input.value.trim().toLowerCase();
    document.querySelectorAll('.person').forEach(el => {
      el.classList.toggle('highlight', term && el.dataset.name.includes(term));
    });
  });
  clearBtn.addEventListener('click', () => { input.value=''; input.dispatchEvent(new Event('input')); });
}

loadData().then(data => {
  setupTabs(data);
  setupSearch();
  renderBranch(data.branches[0]);
});
