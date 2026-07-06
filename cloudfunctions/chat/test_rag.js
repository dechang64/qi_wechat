// v6.2 RAG 真测
const fs = require('fs');
const path = require('path');

const KB_DIR = path.join(__dirname, '..', '..', 'knowledge_base');

function loadKnowledgeBase() {
  const docs = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.md')) {
        const content = fs.readFileSync(full, 'utf8');
        const fm = {};
        const lines = content.split(String.fromCharCode(10));
        let inFm = true;
        for (let i = 0; i < Math.min(lines.length, 10); i++) {
          const line = lines[i].trim();
          if (line === '---') { inFm = false; continue; }
          if (line === '' && Object.keys(fm).length > 0) { inFm = false; continue; }
          if (inFm && line.includes(':') && !line.startsWith('#')) {
            const idx = line.indexOf(':');
            const k = line.substring(0, idx).trim();
            const v = line.substring(idx+1).trim();
            fm[k] = v;
          } else { break; }
        }
        const tagsStr = fm.tags || '';
        const tags = tagsStr.replace(/[[]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
        docs.push({
          path: full,
          title: fm.title || e.name.replace('.md', ''),
          category: fm.category || '',
          tags: tags,
          risk_level: fm.risk_level || 'low',
          content: content,
        });
      }
    }
  };
  walk(KB_DIR);
  return docs;
}

function searchKB(query, docs, topK) {
  topK = topK || 3;
  const q = (query || '').toLowerCase();
  if (!q) return [];
  const qTokens = [];
  const cnChars = q.match(/[一-鿿]+/g) || [];
  for (const seg of cnChars) {
    for (let i = 0; i < seg.length; i++) {
      qTokens.push(seg[i]);
      if (i < seg.length - 1) qTokens.push(seg.substr(i, 2));
    }
  }
  const enWords = q.match(/[a-z]+/g) || [];
  qTokens.push(...enWords);

  const scored = docs.map(function(doc) {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const tagsLower = doc.tags.join(' ').toLowerCase();
    const bodyLower = doc.content.toLowerCase();
    for (const t of qTokens) {
      if (!t) continue;
      if (titleLower.includes(t)) score += 5;
      if (tagsLower.includes(t)) score += 4;
      if (bodyLower.includes(t)) score += 1;
    }
    return { doc: doc, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.filter(function(s) { return s.score > 0; }).slice(0, topK).map(function(s) { return s.doc; });
}

console.log('=== v6.2 RAG 真测 ===');
const docs = loadKnowledgeBase();
console.log('加载 ' + docs.length + ' 文档');
const scenarios = [
  ['失眠', '我最近总是睡不着, 半夜醒来'],
  ['焦虑', '我感到焦虑, 心跳快'],
  ['危机词', '我想消失, 不想活了'],
  ['压力', '我工作压力很大'],
  ['低落', '失眠让我心情很低落'],
];
for (const s of scenarios) {
  console.log('\n[' + s[0] + '] ' + s[1]);
  const hits = searchKB(s[1], docs, 2);
  if (hits.length === 0) console.log('  (无匹配)');
  else hits.forEach(function(d, i) { console.log('  ' + (i+1) + '. ' + d.title); });
}
