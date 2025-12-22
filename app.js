
async function loadPeople() {
  const res = await fetch('data/people.json');
  const people = await res.json();
  return people;
}

function cssSafe(str){ return String(str).replace(/[^a-z0-9]+/gi,'-'); }
function escapeHtml(str){
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function linkify(names){
  if (!names || !names.length) return '—';
  return names.map(n => `<a href="#card-${cssSafe(n)}" class="name-link" data-target="${escapeHtml(n)}">${escapeHtml(n)}</a>`).join(', ');
}

function personCard(p) {
  const card = document.createElement('article');
  card.className = 'person-card';
  card.id = `card-${cssSafe(p.name)}`;
  card.dataset.name = p.name;
  card.innerHTML = `
    <div class="person-header" tabindex="0" role="button" aria-expanded="false" aria-controls="details-${cssSafe(p.name)}">
      <div>
        <div class="person-name">${escapeHtml(p.name)}</div>
        <div class="person-branch">${escapeHtml(p.branch)}</div>
      </div>
      <div class="chevron">▶</div>
    </div>
    <div id="details-${cssSafe(p.name)}" class="person-details">
      <p><span class="label">Spouses:</span> ${linkify(p.spouses)}</p>
      <p><span class="label">Children:</span> ${linkify(p.children)}</p>
      <p><span class="label">Notes:</span> ${escapeHtml(p.notes || '—')}</p>
    </div>
  `;
  const header = card.querySelector('.person-header');
  header.addEventListener('click', () => toggle(card));
  header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(card);} });

  card.querySelectorAll('.name-link').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const targetName = a.getAttribute('data-target');
      goTo(targetName);
    });
  });

  return card;
}

function toggle(card) {
  const open = card.classList.toggle('open');
  const header = card.querySelector('.person-header');
  header.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function render(people) {
  const container = document.getElementById('peopleContainer');
  container.innerHTML = '';
  people.sort((a,b) => a.name.localeCompare(b.name));
  people.forEach(p => container.appendChild(personCard(p)));
}

function setupSearch(people){
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const filtered = people.filter(p => p.name.toLowerCase().includes(q) || (p.notes||'').toLowerCase().includes(q));
    render(filtered);
    setTimeout(() => wireLinks(), 0);
  });
}

function wireLinks(){
  document.querySelectorAll('.name-link').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const targetName = a.getAttribute('data-target');
      goTo(targetName);
    });
  });
}

function goTo(name){
  const id = `card-${cssSafe(name)}`;
  const card = document.getElementById(id);
  if (!card){
    const input = document.getElementById('searchInput');
    input.value = name;
    input.dispatchEvent(new Event('input'));
  }
  const found = document.getElementById(id);
  if (found){
    found.scrollIntoView({behavior:'smooth', block:'center'});
    if (!found.classList.contains('open')) toggle(found);
    found.classList.add('pulse');
    setTimeout(()=> found.classList.remove('pulse'), 1200);
  }
}

loadPeople().then(people => { render(people); setupSearch(people); wireLinks(); });
