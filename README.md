# Видеочат

# Установка

Для разворачивания сервиса в продакшене необходимо иметь:

- Хост (выделенный или облачную виртуальную машину) с публичным IP
- Доменное имя (которое будет указывать на Хост)
- Сертификат SSL (можно сгенерировать Letsencrypt во время разворачивания)

### Разворачивание Node приложения

Необходим Node.js для запуска

Установите зависимости для и запустите сервер

```sh
$ cd /path/to/videochat
$ npm install
$ npm run start
```

Сервер запустится на `3000` порту

### Установка Proxy Nginx сервера

Установте сервер Nginx

```sh
$ apt-get install nginx
```

Скопируйте файл конфигурации

```sh
$ cp /path/to/videochat/configs/nginx/default /etc/nginx/sites-enabled/default
```

Обновите настройки конфигурации

`server_name` - Ваше доменное имя

Перезапустите nginx

```sh
$ service nginx restart
```

### Создание сертификата Let's Encrypt

...

### Установка Turn/Stun сервера

...

# Полезные ссылки:

- https://medium.com/swlh/webrtc-video-chat-application-2e1789cc9e37
- https://www.html5rocks.com/en/tutorials/webrtc/basics/
-  https://www.scaledrone.com/blog/webrtc-tutorial-simple-video-chat/
-  https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/
-  https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
-  https://blog.mozilla.org/webrtc/the-evolution-of-webrtc/
-  https://stackoverflow.com/questions/53251527/webrtc-video-is-not-displaying
-  https://www.youtube.com/watch?v=2Z2PDsqgJP8
-  https://webrtc.github.io/samples/src/content/peerconnection/pc1/
-  https://www.red5pro.com/docs/server/turnstun.html

# Задачи

- ~~Добавить звуковое уведомление что создалась комната~~
- ~~Добавить валидацию запросов на сервер/клиентe~~
- ~~Добавить кнопку проверку соединение с Turn сервером на глвной странице~~
- Добавить окно предупреждения если устройство не поддерживает Webrtc
- Добавить инструкцию в README
	- Что это за приложение
	- ~~Как его установить и запустить~~
	- ~~Как настроить nginx~~
	- Как настроить turn сервер
	- ~~Полезные ссылки~~
	- ~~Задачи~~
- ~~Отзеркалить видео localVideo~~
- ~~Вынести переменные среды в .env~~
- ~~Добавить конфиг Nginx в репозиторий~~
- ~~Исправить баг с Webrtc когда путаются Offerer и Answer~~
- ~~Сделать автоматический переход с http на https~~
- ~~Разделить вебсокет на 3 канала (webrtc, lobby, room) сообщений~~ 
- ~~Сделать страницу с лобби~~
- ~~Обновить контроллер звонка.Удалить кнопку начать звонок, кнопку позвонить~~
- ~~Удалить jQuery~~
- ~~Перенести логику звонка на отдельную страницу~~

