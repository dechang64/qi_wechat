"""
祺臻心理 - 知识库轻量检索
基于 TF-IDF + cosine similarity, 不依赖向量数据库
True本地真测, 没有 mock
"""
import os
import re
import json
import math
import glob

KNOWLEDGE_BASE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'knowledge_base'
)


def load_documents():
    """加载所有 .md 文件, 解析 frontmatter

    v0.1 简化: frontmatter 用首 N 行做 key:value 解析, 不严格依赖 --- 包裹.
    真实生产换 python-frontmatter 或 pyyaml.
    """
    docs = []
    for md_path in glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, '**', '*.md'), recursive=True):
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # 去 BOM + 宽松匹配起始 ---
        content = content.lstrip('\ufeff').lstrip()
        # 如果开头有 --- 标记, 跳过它
        if content.startswith('---'):
            content = content[3:].lstrip('\n')

        fm = {}
        body_lines = []
        in_frontmatter = True
        for i, line in enumerate(content.split('\n')):
            if i < 10 and in_frontmatter:
                stripped = line.strip()
                # 空行或 --- 切到 body
                if stripped == '---':
                    in_frontmatter = False
                    continue
                if stripped == '' and fm:
                    # fm 已有内容, 空行视为分隔
                    in_frontmatter = False
                    continue
                if ':' in stripped and not stripped.startswith('#'):
                    key, value = stripped.split(':', 1)
                    fm[key.strip()] = value.strip()
                else:
                    # 没有 : 的行, 视为 body 开始
                    in_frontmatter = False
                    body_lines.append(line)
            else:
                body_lines.append(line)

        # v0.2 修法: body 包含整个文件 (含 frontmatter), 因为 PowerShell 写文件时 frontmatter 标记被破坏
        # 实际搜索靠 body 内容已经够用, fm 只用作 metadata
        full_body = content  # 整文件

        docs.append({
            'path': md_path,
            'title': fm.get('title', os.path.basename(md_path).replace('.md', '')),
            'category': fm.get('category', ''),
            'tags': [t.strip() for t in fm.get('tags', '').strip('[]').split(',') if t.strip()],
            'risk_level': fm.get('risk_level', 'low'),
            'source': fm.get('source', ''),
            'content': full_body,
        })
    return docs


def tokenize(text):
    """中文按字 + 英文按词"""
    text = text.lower()
    # 英文单词
    en_words = re.findall(r'[a-z]+', text)
    # 中文: 简单按单字 (足够 demo 用, 真实可换 jieba)
    cn_chars = re.findall(r'[\u4e00-\u9fff]', text)
    return en_words + cn_chars


def compute_tfidf(docs):
    """TF-IDF 矩阵"""
    # 1. tokenize
    tokenized = [tokenize(d['content'] + ' ' + d['title'] + ' ' + ' '.join(d['tags'])) for d in docs]

    # 2. document frequency
    df = {}
    for tokens in tokenized:
        for t in set(tokens):
            df[t] = df.get(t, 0) + 1

    # 3. TF-IDF
    n = len(docs)
    tfidf_vectors = []
    for tokens in tokenized:
        tf = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        vec = {}
        for t, cnt in tf.items():
            idf = math.log((n + 1) / (df.get(t, 0) + 1)) + 1  # smoothed IDF
            vec[t] = cnt * idf
        # L2 归一化
        norm = math.sqrt(sum(v * v for v in vec.values())) or 1
        vec = {k: v / norm for k, v in vec.items()}
        tfidf_vectors.append(vec)
    return tfidf_vectors


def cosine_sim(v1, v2):
    """两个稀疏向量的 cosine 相似度"""
    common = set(v1.keys()) & set(v2.keys())
    return sum(v1[k] * v2[k] for k in common)


def search(query, docs, tfidf_vectors, top_k=3, min_score=0.05):
    """检索: 返 top-k 文档 + 分数"""
    query_tokens = tokenize(query)
    query_tf = {}
    for t in query_tokens:
        query_tf[t] = query_tf.get(t, 0) + 1

    # 简化 query vector (没算 IDF, 跟 doc vector 同一空间会略偏高, 但 demo 够用)
    query_vec = {t: cnt for t, cnt in query_tf.items()}
    # 也走 IDF 平滑, 跟文档空间一致
    df_local = {}
    for vec in tfidf_vectors:
        for t in vec.keys():
            df_local[t] = df_local.get(t, 0) + 1
    n = len(docs)
    for t in query_vec:
        idf = math.log((n + 1) / (df_local.get(t, 0) + 1)) + 1
        query_vec[t] *= idf
    norm = math.sqrt(sum(v * v for v in query_vec.values())) or 1
    query_vec = {k: v / norm for k, v in query_vec.items()}

    # 计算相似度
    scored = []
    for i, doc_vec in enumerate(tfidf_vectors):
        sim = cosine_sim(query_vec, doc_vec)
        if sim >= min_score:
            scored.append((sim, i))

    scored.sort(reverse=True)
    return [docs[i] for _, i in scored[:top_k]]


# ============== CLI 测试 ==============

if __name__ == '__main__':
    print('=== 祺臻心理 · 知识库 RAG 检索 ===\n')

    docs = load_documents()
    print(f'加载文档数: {len(docs)}')
    for d in docs:
        print(f'  - [{d["category"]}] {d["title"]} (tags={len(d["tags"])})')
    print()

    tfidf = compute_tfidf(docs)

    test_queries = [
        '我最近总是睡不着, 半夜醒来',
        '我感到焦虑, 心跳快',
        '我老公出轨了, 我很崩溃',
        '我想消失, 不想活了',
        '我最近工作压力大, 该怎么办',
        '什么是 MBTI 性格',
    ]

    for q in test_queries:
        print(f'\n查询: "{q}"')
        results = search(q, docs, tfidf, top_k=2)
        if not results:
            print('  (无相关)')
        for r in results:
            print(f'  → {r["title"]} ({r["category"]})')