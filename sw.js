const CACHE_NAME = 'class-app-cache-v3.11.1'; // 버전이 올라갈 때 자동 갱신됨

self.addEventListener('install', (event) => {
    self.skipWaiting(); // 새 워커가 즉시 대기열을 건너뛰고 설치되게 함
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 현재 이름과 다른 옛날 캐시 창고는 모조리 삭제!
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // 즉시 모든 화면을 새 워커가 제어하게 함
});

self.addEventListener('fetch', (event) => {
    // update.json 파일은 절대 캐시(저장)하지 않고 무조건 인터넷에서 새로 가져옴!
    if (event.request.url.includes('update.json')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // 나머지는 캐시를 먼저 확인하고 없으면 인터넷에서 가져옴
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => fetch(event.request))
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});