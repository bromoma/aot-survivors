const { spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const files = process.argv.slice(3), out = process.argv[2], Z = 3;
const root = path.resolve(__dirname, '..');
const html = `<!doctype html><body style="margin:0"><canvas id=c></canvas><script>
const files=${JSON.stringify(files.map(f => 'file://' + path.resolve(f)))};let loaded=[];let n=0;
files.forEach((f,i)=>{const im=new Image();im.onload=()=>{loaded[i]=im;if(++n===files.length)draw()};im.src=f;});
function draw(){const c=document.getElementById('c'),Z=${Z};const W=loaded.reduce((a,i)=>a+i.width*Z+16,16),H=Math.max(...loaded.map(i=>i.height*Z))+32;c.width=W;c.height=H;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#56624a';g.fillRect(0,0,W,H);let x=16;for(const i of loaded){g.drawImage(i,x,H-16-i.height*Z,i.width*Z,i.height*Z);x+=i.width*Z+16;}const p=document.createElement('pre');p.id='out';p.textContent=c.toDataURL();document.body.appendChild(p);}
</script></body>`;
const tmp = path.join(root, 'dev', '_preview.html');
fs.writeFileSync(tmp, html);
const dom = spawnSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--user-data-dir=${require('os').tmpdir()}/aot-cut-${process.pid}`, '--allow-file-access-from-files', '--virtual-time-budget=10000', '--dump-dom', 'file://' + tmp], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).stdout.toString();
const m = dom.match(/<pre id="out">data:image\/png;base64,([^<]*)<\/pre>/);
fs.writeFileSync(out, Buffer.from(m[1], 'base64'));
fs.unlinkSync(tmp);
console.log('ok', out);
