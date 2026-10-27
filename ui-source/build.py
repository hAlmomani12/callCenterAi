"""Rebuild app/ui.html from ui-source/.

Usage (from the project root):
    cd ui-source && npm install && npx esbuild app.js --bundle --format=iife --minify --target=es2020 --outfile=bundle.js
    python ui-source/build.py
"""
import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "app", "ui.html")

t = open(os.path.join(HERE, "template2.html"), encoding="utf-8").read()
for f in os.listdir(os.path.join(HERE, "assets")):
    key = f.rsplit(".", 1)[0]
    mime = "image/webp" if f.endswith(".webp") else "image/png"
    data = base64.b64encode(open(os.path.join(HERE, "assets", f), "rb").read()).decode()
    t = t.replace("{{%s}}" % key, f"data:{mime};base64,{data}")
assert "{{" not in t, "missing asset placeholder"
bundle = open(os.path.join(HERE, "bundle.js"), encoding="utf-8").read().replace("</script", "<\\/script")
open(OUT, "w", encoding="utf-8").write(t.replace("/*__BUNDLE__*/", bundle))
print("wrote", os.path.normpath(OUT))
