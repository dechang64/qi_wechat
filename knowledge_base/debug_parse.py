"""debug frontmatter parse"""
import sys
sys.path.insert(0, 'C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat')
from knowledge_base.retriever import load_documents

with open('C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat/knowledge_base/therapies/cbt.md', 'r', encoding='utf-8') as f:
    raw = f.read()
print('=== raw first 200 chars ===')
print(repr(raw[:200]))
print()
docs = load_documents()
print(f'\nloaded {len(docs)} docs')
for d in docs[:3]:
    print(f'  cat=[{d["category"]}] title={d["title"]} tags={d["tags"]}')