// Colour themes: o = main accent (buttons/links), o2 = light accent used on dark areas, cream/cream2 = soft tint backgrounds, bn1/bn2 = banner gradient
const THEMES={
 sunrise:{n:'Sunrise (orange)',o:'#ff7a1a',o2:'#ff7a1a',cream:'#fff2d4',cream2:'#f6e3b4',bn1:'#ffe7d1',bn2:'#ffd2a8'},
 ocean:{n:'Ocean blue',o:'#1a73e8',o2:'#8ab4f8',cream:'#e8f0fe',cream2:'#d2e3fc'},
 navy:{n:'Royal navy',o:'#1e40af',o2:'#93a5f5',cream:'#eaeefc',cream2:'#d3dcf8'},
 sky:{n:'Sky',o:'#0369a1',o2:'#7dd3fc',cream:'#e6f4fb',cream2:'#c7e6f6'},
 indigo:{n:'Indigo',o:'#4f46e5',o2:'#a5b4fc',cream:'#eceefe',cream2:'#d8dbfc'},
 purple:{n:'Royal purple',o:'#6d28d9',o2:'#c4b5fd',cream:'#f1eafe',cream2:'#e0d3fb'},
 teal:{n:'Teal',o:'#0f766e',o2:'#5eead4',cream:'#e6f7f5',cream2:'#c9efea'},
 emerald:{n:'Emerald',o:'#0b8043',o2:'#81c995',cream:'#e6f4ea',cream2:'#ceead6'},
 forest:{n:'Forest green',o:'#2e6b2f',o2:'#a5d6a7',cream:'#eef6ec',cream2:'#d8ead3'},
 lime:{n:'Fresh green',o:'#4d7c0f',o2:'#bef264',cream:'#f3f9e5',cream2:'#e2efc3'},
 gold:{n:'Golden',o:'#a16207',o2:'#f6c85f',cream:'#fdf6e3',cream2:'#f5e6b8'},
 coffee:{n:'Coffee brown',o:'#92400e',o2:'#e0b48a',cream:'#f8efe6',cream2:'#efdcc7'},
 maroon:{n:'Maroon classic',o:'#9b1c31',o2:'#e8a0ad',cream:'#fbeef0',cream2:'#f3d5da'},
 crimson:{n:'Crimson',o:'#c62828',o2:'#fca5a5',cream:'#fdecec',cream2:'#fbd0d0'},
 rose:{n:'Rose',o:'#be185d',o2:'#f9a8d4',cream:'#fdeaf3',cream2:'#fbcfe5'},
 slate:{n:'Slate grey',o:'#334155',o2:'#94a3b8',cream:'#f1f5f9',cream2:'#e2e8f0'}
};
function applyTheme(){
 const r=document.documentElement,t=THEMES[CFG.theme];['--o','--o2','--cream','--cream2','--soft','--bn1','--bn2'].forEach(k=>r.style.removeProperty(k));
 if(!t){r.removeAttribute('data-alt');r.style.setProperty('--o',CFG.accent||'#ff7a1a');return}
 r.style.setProperty('--o',t.o);r.style.setProperty('--o2',t.o2);r.style.setProperty('--cream',t.cream);r.style.setProperty('--cream2',t.cream2);r.style.setProperty('--soft',t.cream);r.style.setProperty('--bn1',t.bn1||t.cream);r.style.setProperty('--bn2',t.bn2||t.cream2);
 if(CFG.theme==='sunrise')r.removeAttribute('data-alt');else r.setAttribute('data-alt','')}
