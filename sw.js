const CACHE_NAME = 'class-app-cache-v2'; // 버전을 올려서 새로 적용되게 합니다.

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); 
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // ✅ [중요] 파이어베이스 인증, 시트 전송 등 외부 API는 절대 가로채지 않음!
    if (
        url.includes('google') || 
        url.includes('firebase') || 
        url.includes('googleapis') ||
        event.request.method !== 'GET' // POST 요청(로그인, 저장 등)은 무조건 통과
    ) {
        return; // 서비스 워커가 개입하지 않고 원래 네트워크대로 실행됨
    }

    // update.json은 무조건 네트워크에서 새로 가져오기
    if (url.includes('update.json')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }
    
    // 나머지는 네트워크 우선, 실패 시 캐시 사용
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 정상적인 응답일 때만 캐시에 저장
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;
                
                // ✅ 핵심: 캐시에도 없다면 undefined가 아닌 에러 Response 객체를 반환해야 함!
                return new Response('Network error occurred and no cache available', {
                    status: 404,
                    statusText: 'Not Found'
                });
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});