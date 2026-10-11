"""Embed player sources so the HTML can still be pasted as a Claude artifact."""
from pathlib import Path
import json,re,base64
root=Path(__file__).resolve().parents[1]
p=root/'sablewood-tracker.html';s=p.read_text()
sheet_css=(root/'players/player.css').read_text()
def embed_asset(m):
 asset=root/m.group(1);mime='font/woff2' if asset.suffix=='.woff2' else 'image/svg+xml'
 return 'url("data:'+mime+';base64,'+base64.b64encode(asset.read_bytes()).decode()+'")'
sheet_css=re.sub(r'url\("(players/assets/[^"]+)"\)',embed_asset,sheet_css)
css='/* PLAYER_STYLE_START */\n'+sheet_css+'\n/* PLAYER_STYLE_END */'
# illustrazioni degli equipaggiamenti: si incorpora la versione ridotta per la carta (players/assets/equipment/card/),
# una sola volta per immagine anche se più oggetti la condividono, così l'HTML resta sotto il limite degli artifact
def card_art(path):
 small=root/Path(path).parent/'card'/Path(path).name
 return small if small.exists() else root/path
art_map=json.loads((root/'players/equipment-art.json').read_text());art_files=sorted(set(art_map.values()))
art_data=['data:image/webp;base64,'+base64.b64encode(card_art(f).read_bytes()).decode() for f in art_files]
art_js='(()=>{const I='+json.dumps(art_data,separators=(',',':'))+',M='+json.dumps({k:art_files.index(v) for k,v in art_map.items()},separators=(',',':'))+';return Object.fromEntries(Object.entries(M).map(([k,i])=>[k,I[i]]))})()'
js='/* PLAYER_CODE_START */\nconst EQ_ART='+art_js+';\nconst PLAYER_RULES='+json.dumps(json.loads((root/'players/rules.json').read_text()),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\nconst PL_CARD_RULES='+json.dumps(json.loads((root/'players/card-controls.json').read_text()),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'+'const EQ_CATALOG='+json.dumps(json.loads((root/'players/equipment.json').read_text()),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+';\n'+(root/'players/equipment.js').read_text()+'\n'+(root/'players/card-resources.js').read_text()+'\n'+(root/'players/card-effects.js').read_text()+'\n'+(root/'players/class-features.js').read_text()+'\n'+(root/'players/print-sheet.js').read_text()+'\n'+(root/'players/chat.js').read_text()+'\n'+(root/'players/eq-print.js').read_text()+'\n'+(root/'players/player.js').read_text()+'\n'+(root/'players/pregens.js').read_text()+'\n/* PLAYER_CODE_END */'
if '/* PLAYER_STYLE_START */' in s:s=re.sub(r'/\* PLAYER_STYLE_START \*/.*?/\* PLAYER_STYLE_END \*/',lambda m:css,s,flags=re.S)
else:s=s.replace('</style>',css+'\n</style>',1)
if '/* PLAYER_CODE_START */' in s:s=re.sub(r'/\* PLAYER_CODE_START \*/.*?/\* PLAYER_CODE_END \*/',lambda m:js,s,flags=re.S)
else:s=s.replace('// all\'avvio: la vista dei giocatori',js+'\n// all\'avvio: la vista dei giocatori',1)
p.write_text(s)
