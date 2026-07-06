"""debug tokenize"""
import sys
sys.path.insert(0, 'C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat')
from knowledge_base.retriever import load_documents, tokenize

docs = load_documents()
# 写文件验证 (绕过终端 mojibake)
with open('C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat/knowledge_base/_dbg_out.txt', 'w', encoding='utf-8') as f:
    f.write('=== all docs ===\n')
    for d in docs:
        f.write(f'[{d["category"]}] {d["title"]}\n')
    f.write('\n=== 焦虑 doc detail ===\n')
    for d in docs:
        if '焦虑' in d['title']:
            f.write(f'content_len={len(d["content"])}\n')
            f.write(f'first_200={d["content"][:200]}\n')
            tokens = tokenize(d['content'])
            f.write(f'token_count={len(tokens)}\n')
            f.write(f'sample_tokens={tokens[:30]}\n')
            q = tokenize('睡不着')
            f.write(f'query_tokens={q}\n')
            overlap = set(tokens) & set(q)
            f.write(f'overlap_with_睡不着={overlap}\n')
            break
    f.write('\n=== 睡不着 失眠 doc ===\n')
    for d in docs:
        if '失眠' in d['title']:
            f.write(f'content_len={len(d["content"])}\n')
            tokens = tokenize(d['content'])
            f.write(f'token_count={len(tokens)}\n')
            f.write(f'has_睡={("睡" in tokens)}\n')
            f.write(f'has_不={"不" in tokens}\n')
            f.write(f'has_着={"着" in tokens}\n')
            q = tokenize('睡不着')
            f.write(f'query={q}\n')
            break
print('written to _dbg_out.txt')