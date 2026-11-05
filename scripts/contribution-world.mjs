import assert from 'node:assert/strict';
import {render} from './contribution-world.mjs';
const days=Array.from({length:28},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,contributionCount:0}));
assert.match(render(days,'a&b'),/0 contributions over 28 days/);
assert.match(render(days,'a&b'),/a&amp;b/);
days[0].contributionCount=12;
days[27].contributionCount=1;
const svg=render(days,'test');
assert.match(svg,/13 contributions over 28 days/);
assert.match(svg,/2026-10-01: 12 contributions/);
assert.equal((svg.match(/<ellipse/g)||[]).length,4);
assert.match(svg,/2\/28/);
assert.throws(()=>render([], 'test'));
days[0].contributionCount=-1;
assert.throws(()=>render(days,'test'));
console.log('Passed: empty activity, totals, exact counts, coin cap, escaping and invalid input.');

import {writeFile, mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function render(days, username, demo = false) {
  if (days.length !== 28 || days.some(d => !/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isInteger(d.contributionCount) || d.contributionCount < 0)) throw Error('Expected 28 valid contribution days');
  const total = days.reduce((s,d) => s+d.contributionCount,0);
  const active = days.filter(d => d.contributionCount).length;
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="1008" height="400" viewBox="0 0 1008 400" role="img" aria-labelledby="title desc">
  <title id="title">${esc(username)} contribution world${demo?' — SAMPLE DATA':''}</title>
  <desc id="desc">${total} contributions over 28 days. Each block is one day; coin stacks indicate 1, 2, or 3+ contributions. Mushrooms mark 5+ contributions. Exact daily counts appear below blocks. Animation is decorative.</desc>
  <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#111b42"/><stop offset="1" stop-color="#355385"/></linearGradient></defs>
  <style>text{font-family:monospace;fill:#f2f5ff} .tiny{font-size:11px} .label{font-size:13px;fill:#b9c9ea} .heading{font-size:22px;font-weight:bold} @media(prefers-reduced-motion:reduce){.runner{display:none}}</style>
  <rect width="1008" height="400" rx="16" fill="#10182e"/>
  <path d="M0 100H1008V340H0Z" fill="url(#sky)"/>
  <text x="28" y="36" class="heading">CONTRIBUTION WORLD</text>
  <text x="28" y="63" class="label">${esc(username)} / ${days[0].date} — ${days[27].date}${demo?' / SAMPLE DATA':''}</text>
  <text x="720" y="35" class="label">CONTRIBUTIONS</text><text x="720" y="64" class="heading">${total}</text>
  <text x="890" y="35" class="label">ACTIVE DAYS</text><text x="890" y="64" class="heading">${active}/28</text>`];
  for(let i=0;i<20;i++) out.push(`<rect x="${20+i*51}" y="${115+(i*17)%61}" width="3" height="3" fill="#b8d4ff" opacity=".55"/>`);
  for(const [x,y] of [[60,170],[340,144],[650,168],[860,135]]) out.push(`<path d="M${x} ${y}h16v-10h35v10h20v15h-71z" fill="#c9dafa" opacity=".22"/>`);
  out.push('<path d="M0 278L100 195L210 278L350 202L475 278L650 190L790 278L920 210L1008 278V340H0Z" fill="#284d63"/><path d="M0 290L170 244L340 290L540 230L750 290L900 250L1008 290V340H0Z" fill="#346a66"/>');
  days.forEach((day,i) => {
    const x=30+i*34, n=day.contributionCount;
    out.push(`<g><title>${day.date}: ${n} contributions</title><rect x="${x}" y="272" width="28" height="28" rx="2" fill="${n?'#e9a33b':'#394763'}" stroke="${n?'#ffe1a0':'#64718b'}" stroke-width="2"/><text x="${x+14}" y="292" text-anchor="middle" font-size="19" font-weight="bold">${n?'?':'·'}</text><text x="${x+14}" y="318" text-anchor="middle" class="tiny">${n}</text>`);
    for(let j=0;j<Math.min(n,3);j++) out.push(`<ellipse cx="${x+14}" cy="${255-j*19}" rx="6" ry="8" fill="#ffd65a" stroke="#fff0ac" stroke-width="2"/><path d="M${x+14} ${250-j*19}v10" stroke="#b7791f" stroke-width="2"/>`);
    if(n>=5) out.push(`<path d="M${x+6} 188v-7h4v-4h8v4h4v7z" fill="#ff6066"/><path d="M${x+10} 188v8h8v-8" fill="#ffe2b1"/><rect x="${x+11}" y="180" width="4" height="4" fill="white"/>`);
    out.push('</g>');
  });
  // Pixel character is drawn here, with no external image dependencies.
  const sprite=['....RRRR....','...RRRRRRR..','...HHSSK....','..HSHSSSK...','..HSSHHSS...','....SSSS....','...RRBRR....','..RRRBRRR...','.SSBBBBSS...','...BBBBBB...','...BB.BB....','..HH...HH...'];
  const colors={R:'#fa4e50',H:'#5c3329',S:'#ffd2a1',K:'#162035',B:'#4384f5'};
  const path=days.map((d,i)=>`${30+i*34} ${d.contributionCount?222:236}`).join(';');
  out.push(`<g class="runner"><animateTransform attributeName="transform" type="translate" values="${path};948 236;30 236" dur="24s" repeatCount="indefinite"/>`);
  sprite.forEach((row,y)=>[...row].forEach((c,x)=>{if(colors[c])out.push(`<rect x="${x*2}" y="${y*2}" width="2" height="2" fill="${colors[c]}"/>`);}));
  out.push('</g><rect y="330" width="1008" height="7" fill="#73d89a"/><path d="M0 337H1008V346H0Z" fill="#38765a"/>');
  out.push(`<text x="28" y="370" class="label">1 BLOCK = 1 DAY · COINS = 1 / 2 / 3+ · MUSHROOM = 5+</text><text x="28" y="390" class="tiny">Numbers show exact daily contributions · Updated daily · Fan-made pixel platformer</text></svg>`);
  return out.join('\n');
}

async function main() {
  const demo=process.argv.includes('--demo'), username=process.env.GITHUB_USER || 'Melvin-Gounder';
  let days;
  if(demo) {
    days=Array.from({length:28},(_,i)=>({date:new Date(Date.UTC(2026,9,9+i)).toISOString().slice(0,10),contributionCount:[0,1,0,3,2,0,6,0,0,1,4,0,8,2][i%14]}));
  } else {
    const token=process.env.GH_TOKEN;
    if(!token) throw Error('Missing GH_TOKEN. Configure METRICS_TOKEN as a repository secret.');
    const query='query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}';
    const response=await fetch('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','User-Agent':'contribution-world'},body:JSON.stringify({query,variables:{login:username}}),signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw Error(`GitHub request failed: HTTP ${response.status}`);
    const data=await response.json();
    if(data.errors || !data.data?.user) throw Error('GitHub could not return contribution data. Check the username and token.');
    days=data.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(w=>w.contributionDays).sort((a,b)=>a.date.localeCompare(b.date)).slice(-28);
  }
  const output=demo?'preview-sample.svg':'assets/contribution-world.svg';
  await mkdir('assets',{recursive:true});
  await writeFile(output,render(days,username,demo));
  console.log(`Created ${output}${demo?' (sample data, not live contributions)':''}`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
