// 캐시 이름 (버전 업데이트 시 이 이름을 변경하면 브라우저가 새로운 버전으로 인식합니다)
const CACHE_NAME = 'checklist-app-v3.4.8';

// 캐싱할 파일 목록 (오프라인에서도 실행되게 하려면 CDN 주소들도 여기에 포함해야 합니다)
const URLS_TO_CACHE = [
  './',
  './index.html',
  // 필요한 경우 아이콘이나 다른 로컬 에셋 경로를 추가하세요.
];

// 1. 설치 (Install): 서비스 워커가 처음 설치될 때 실행됩니다.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 저장 중...');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// 2. 활성화 (Activate): 서비스 워커가 활성화될 때 실행됩니다. (구버전 캐시 정리)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 현재 버전의 캐시가 아니면 삭제합니다.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. 요청 (Fetch): 네트워크 요청을 가로채서 캐시된 내용을 반환하거나 네트워크로 요청합니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request);
      })
  );
});

// 4. 메시지 (Message): 클라이언트에서 'SKIP_WAITING' 메시지를 보내면 대기 중인 워커를 즉시 활성화합니다.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});