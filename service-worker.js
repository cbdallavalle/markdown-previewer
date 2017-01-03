self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('assets-v1').then(cache => {
      return cache.addAll([
        '/index.html',
        '/app.js',
        '/css/app.css',
        '/lib/markdown-it.min.js'
      ])
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', event => {
  let mdContent = event.data.mdContent;
  let mdFileName = event.data.mdFileName;
  console.log('mdContent: ', mdContent);
  let client = self.clients.matchAll().then(clients => clients[0]);
  let dbReq = indexedDB.open('mdFileHistory');

  dbReq.onsuccess = (event) => {
    console.log('DB opened from service worker');
    
    let db = event.target.result;
    let transaction = db.transaction(['mdFiles'], 'readwrite');

    transaction.oncomplete = (event) => {
      console.log('Transaction Success');
    }

    transaction.onerror = (event) => {
      console.log('Transaction Error');
    }

    let objectStore = transaction.objectStore("mdFiles");
    let objectStoreReq = objectStore.add({ 
      fileName: `${mdFileName}.md`,
      authorName: 'Brittany Storoz',
      markdownContent: mdContent
    });

    objectStoreReq.onsuccess = (event) => {
      console.log('objectStore request succeeded');
    }

    objectStoreReq.onerror = (event) => {
      console.log('objectStore request failed');
    };
  };

  dbReq.onerror = (event) => {
    console.log('DB not opened from sw');
  };

});