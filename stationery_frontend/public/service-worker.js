self.addEventListener('push', function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/StatioMart New.jpeg',
    badge: '/StatioMart New.jpeg',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'StatioMart',
      options
    )
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});