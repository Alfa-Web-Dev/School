// Public website ab PWA nahi hai. Ye file sirf un phones ke liye hai jinhone purana service worker install kar liya tha:
// ye khud ko hata deta hai aur uska cache saaf kar deta hai. Admin/teacher/student ke apne service worker alag folder me hain.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 try{const ks=await caches.keys();await Promise.all(ks.filter(k=>k.indexOf('sp-site-')===0).map(k=>caches.delete(k)))}catch(x){}
 try{await self.registration.unregister()}catch(x){}
})()));
