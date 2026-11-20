# python3 dev/add_i18n.py rows.json — appends [English, Spanish, Russian] rows to I18N_ROWS in src/i18n.js,
# skipping English keys that already exist.
import re, sys, json, os

p = os.path.join(os.path.dirname(__file__), '..', 'src', 'i18n.js')
s = open(p).read()
rows = json.load(open(sys.argv[1]))
start = s.index('const I18N_ROWS = [')
end = s.index('\n];', start)
existing = set()
for m in re.finditer(r"^  \[('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"),", s[start:end], re.M):
    existing.add(m.group(1)[1:-1].replace("\\'", "'"))

def q(x):
    if "'" in x and '"' not in x: return '"' + x + '"'
    return "'" + x.replace('\\', '\\\\').replace("'", "\\'") + "'"

add = [r for r in rows if r[0] not in existing]
ins = ''.join('  [%s, %s, %s],\n' % (q(a), q(b), q(c)) for a, b, c in add)
if ins: s = s[:end] + '\n' + ins.rstrip('\n') + s[end:]
open(p, 'w').write(s)
print('added', len(add), 'existing', [r[0] for r in rows if r[0] in existing])
