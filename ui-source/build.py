import base64, os
d='/tmp/claude-0/ui/'
t=open(d+'template3.html').read()
for f in os.listdir(d+'assets'):
    key=f.rsplit('.',1)[0]; mime='image/webp' if f.endswith('.webp') else 'image/png'
    t=t.replace('{{%s}}'%key, 'data:%s;base64,%s'%(mime, base64.b64encode(open(d+'assets/'+f,'rb').read()).decode()))
assert '{{' not in t, [x[:30] for x in t.split('{{')[1:]]
b=open(d+'bundle.js').read().replace('</script','<\\/script')
open(d+'ui.html','w').write(t.replace('/*__BUNDLE__*/',b))
print(os.path.getsize(d+'ui.html')//1024,'KB')
