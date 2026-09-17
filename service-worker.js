const CACHE_NAME="hevy-analytics-public-v4";
const SHELL=["./","./index.html","./dashboard.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./ui-v2.css","./ui-v2.js"];

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(SHELL)));
});

self.addEventListener("activate",e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

async function injectDashboard(response){
  const type=response.headers.get("content-type")||"";
  if(!response.ok || !type.includes("text/html")) return response;
  let text=await response.text();
  if(!text.includes("ui-v2.css")) text=text.replace("</head>",'<link rel="stylesheet" href="./ui-v2.css">\n</head>');
  if(!text.includes("ui-v2.js")) text=text.replace("</body>",'<script src="./ui-v2.js"></script>\n</body>');
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  const url=new URL(e.request.url);
  const isDashboard=url.pathname.endsWith("/dashboard.html");

  if(e.request.mode==="navigate"){
    e.respondWith((async()=>{
      try{
        const network=await fetch(e.request,{cache:"no-store"});
        const raw=network.clone();
        if(network.ok) caches.open(CACHE_NAME).then(c=>c.put(e.request,raw));
        return isDashboard?await injectDashboard(network):network;
      }catch(_){
        const cached=await caches.match(e.request) || await caches.match(isDashboard?"./dashboard.html":"./index.html");
        return isDashboard && cached?await injectDashboard(cached):cached;
      }
    })());
    return;
  }

  e.respondWith(caches.match(e.request).then(hit=>{
    if(hit) return hit;
    return fetch(e.request).then(r=>{
      if(r&&r.ok){const cp=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cp));}
      return r;
    });
  }));
});
