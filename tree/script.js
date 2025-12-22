
let data; // in-memory tree
let editMode = false;
let idCounter = 1;

async function loadData() {
  const saved = localStorage.getItem('familyData');
  if (saved) {
    return JSON.parse(saved);
  }
  const res = await fetch('data.json');
  return res.json();
}

function assignIds() {
  idCounter = 1;
  data.branches.forEach(b => traverseAssign(b.root));
}

function traverseAssign(node) {
  node.id = node.id || `n${idCounter++}`;
  if (node.children) node.children.forEach(traverseAssign);
}

function personSpan(name, nodeId) {
  const span = document.createElement('span');
  span.className = 'person';
  span.textContent = name;
  span.dataset.name = name.toLowerCase();
  span.addEventListener('click', () => showCardByNodeId(nodeId));
  return span;
}

function buildNode(node, depth = 0) {
  const details = document.createElement('details');
  if (depth < 1) details.open = true;
  const summary = document.createElement('summary');
  summary.textContent = node.label || (node.people ? node.people.join(' & ') : '');
  summary.addEventListener('click', (e) => { e.stopPropagation(); showCard(node); });
  details.appendChild(summary);

  if (node.notes) {
    const meta = document.createElement('div');
    meta.className = 'node-meta';
    meta.textContent = `Notes: ${node.notes}`;
    details.appendChild(meta);
  }

  if (node.spouses) {
    const sp = document.createElement('div');
    sp.className = 'node-meta';
    sp.textContent = 'Spouses: ';
    node.spouses.forEach(s => {
      sp.appendChild(personSpan(s.name, node.id));
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

  if (node.people) {
    const wrap = document.createElement('div');
    wrap.className = 'node-meta';
    wrap.textContent = 'People: ';
    node.people.forEach(p => { wrap.appendChild(personSpan(p, node.id)); wrap.appendChild(document.createTextNode('  ')); });
    details.appendChild(wrap);
  }

  if (node.link) {
    const a = document.createElement('div');
    a.className = 'node-meta';
    const link = document.createElement('a');
    link.href = node.link;
    link.textContent = '↗ cross-branch link';
    a.appendChild(link);
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

function setupTabs() {
  const nav = document.getElementById('branchTabs');
  nav.innerHTML = '';
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
  renderBranch(data.branches[0]);
}

function showCard(node) {
  const form = document.getElementById('editForm');
  const card = document.getElementById('cardContent');
  if (!editMode) {
    form.hidden = true;
    card.innerHTML = `<h3>${node.label || (node.people ? node.people.join(' & ') : '')}</h3><p>Enable Edit Mode to modify this node or add relatives.</p>`;
    return;
  }
  form.hidden = false;
  document.getElementById('nodeId').value = node.id;
  document.getElementById('labelInput').value = node.label || '';
  document.getElementById('notesInput').value = node.notes || '';
  document.getElementById('peopleInput').value = (node.people || []).join(', ');
  card.innerHTML = `<h3>Editing: ${node.label || node.id}</h3>`;
}

function showCardByNodeId(id) {
  const node = findNodeById(id);
  if (node) showCard(node);
}

function findNodeById(id) {
  let found = null;
  function walk(n){
    if (n.id === id) { found = n; return; }
    (n.children||[]).forEach(walk);
  }
  data.branches.forEach(b => walk(b.root));
  return found;
}

function saveCurrentNode() {
  const id = document.getElementById('nodeId').value;
  const node = findNodeById(id);
  if (!node) return;
  node.label = document.getElementById('labelInput').value.trim();
  node.notes = document.getElementById('notesInput').value.trim() || undefined;
  const peopleStr = document.getElementById('peopleInput').value.trim();
  node.people = peopleStr ? peopleStr.split(',').map(s => s.trim()).filter(Boolean) : [];
  persist();
  setupTabs();
  showCard(node);
}

function addChildToCurrent() {
  const id = document.getElementById('nodeId').value;
  const node = findNodeById(id);
  if (!node) return;
  const child = { label: 'New Person', people: ['New Person'], children: [] };
  child.id = `n${idCounter++}`;
  node.children = node.children || [];
  node.children.push(child);
  persist();
  setupTabs();
  showCard(child);
}

function addSpouseToCurrent() {
  const id = document.getElementById('nodeId').value;
  const node = findNodeById(id);
  if (!node) return;
  const name = prompt('Spouse name');
  if (!name) return;
  node.spouses = node.spouses || [];
  node.spouses.push({ name: name });
  persist();
  setupTabs();
  showCard(node);
}

function deleteCurrentNode() {
  const id = document.getElementById('nodeId').value;
  if (!id || !confirm('Delete this node and all its descendants?')) return;
  data.branches.forEach(b => {
    function prune(parent) {
      if (!parent.children) return;
      parent.children = parent.children.filter(c => c.id !== id);
      parent.children.forEach(prune);
    }
    prune(b.root);
    if (b.root.id === id) alert('Root nodes cannot be deleted.');
  });
  persist();
  setupTabs();
  document.getElementById('editForm').hidden = true;
}

function persist() {
  localStorage.setItem('familyData', JSON.stringify(data));
}

function exportJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'seeber_family_tree.json'; a.click();
  URL.revokeObjectURL(url);
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      data = obj; assignIds(); persist(); setupTabs();
    } catch (e) { alert('Invalid JSON'); }
  };
  reader.readAsText(file);
}

function resetData() {
  localStorage.removeItem('familyData');
  location.reload();
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
  clearBtn.addEventListener('click', () => { input.value = ''; input.dispatchEvent(new Event('input')); });
}

function setupControls() {
  const toggleBtn = document.getElementById('toggleEdit');
  toggleBtn.addEventListener('click', () => {
    editMode = !editMode;
    toggleBtn.textContent = editMode ? 'Disable Edit Mode' : 'Enable Edit Mode';
    document.getElementById('editForm').hidden = !editMode;
  });
  document.getElementById('saveNode').addEventListener('click', saveCurrentNode);
  document.getElementById('addChild').addEventListener('click', addChildToCurrent);
  document.getElementById('addSpouse').addEventListener('click', addSpouseToCurrent);
  document.getElementById('deleteNode').addEventListener('click', deleteCurrentNode);
  document.getElementById('exportJson').addEventListener('click', exportJson);
  document.getElementById('importJson').addEventListener('change', e => importJsonFile(e.target.files[0]));
  document.getElementById('resetData').addEventListener('click', resetData);
}

// Boot
loadData().then(d => { data = d; assignIds(); setupTabs(); setupSearch(); setupControls(); });
