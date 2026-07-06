"""debug raw"""
with open('C:/Users/decha/.mavis/agents/mavis/workspace/qi_wechat/knowledge_base/therapies/cbt.md', 'r', encoding='utf-8') as f:
    content = f.read()
print('前 50 字符:')
print(repr(content[:50]))
print()
print('starts with ---:', content.startswith('---'))
print()
parts = content.split('---', 2)
print('parts 数量:', len(parts))
if len(parts) >= 3:
    print('--- part[1] ---')
    print(repr(parts[1][:200]))
    print('--- part[2] 前 50 ---')
    print(repr(parts[2][:50]))