// Simple theme toggle script
(function(){
  const KEY = 'site-theme';
  const btn = document.getElementById('themeToggle');
  if(!btn) return;

  function setTheme(theme){
    const el = document.documentElement;
    if(theme === 'dark') el.setAttribute('data-theme','dark');
    else el.removeAttribute('data-theme');
    try { localStorage.setItem(KEY, theme); } catch(e){}
    btn.textContent = theme === 'dark' ? 'Toggle light' : 'Toggle dark';
  }

  // read saved preference or system preference
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}
  if(saved) setTheme(saved);
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

  btn.addEventListener('click', function(){
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'light' : 'dark');
  });
})();
