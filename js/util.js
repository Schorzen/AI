/* Small helpers shared by every file: $, modal open/close, escaping, toast messages. */
const $=id=>document.getElementById(id);   /* shorthand used everywhere */
const openM=id=>{$(id).style.display='flex'},closeM=id=>{$(id).style.display='none'};
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t,ms){const e=$('toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>{e.style.opacity=0},ms||1200)}
