# 🌐 Пошаговое руководство по деплою парсера CMA Expert на Timeweb VDS (realty-analytics.ru)

Данное руководство предназначено для развертывания проекта на виртуальном сервере **Timeweb VDS/VPS** под управлением **Ubuntu 22.04 / 24.04 LTS** для работы по домену **`realty-analytics.ru`**.

---

## ⚠️ Важное примечание перед началом
Обычный виртуальный хостинг (PHP) Timeweb не подходит для работы данного парсера, так как проекту необходим **Node.js 20+** и встроенный headless-браузер **Playwright (Chromium)**.

Для запуска создайте VDS-сервер в панели Timeweb (**Левое меню -> VDS/VPS Серверы -> Заказать VDS**), выбрав ОС **Ubuntu 22.04** или **24.04**.

---

## 🛠️ Предварительные требования

1. **Доступ к VDS Timeweb**: IP-адрес вашего сервера и пароль `root` (высылается на почту при создании VDS).
2. **Привязка домена `realty-analytics.ru`**:
   - В панели Timeweb перейдите в раздел **Домены и SSL**.
   - Укажите **A-запись** для `realty-analytics.ru` и `www.realty-analytics.ru`, направляющую на **IP-адрес вашего VDS-сервера**.

---

## 📋 Шаг 1. Первоначальное подключение к VDS по SSH

Откройте PowerShell (в Windows) или Терминал и подключитесь к VDS:

```bash
ssh root@<IP_ВАШЕГО_VDS>
```
*(Замените `<IP_ВАШЕГО_VDS>` на реальный IP-адрес вашего сервера)*

Обновите системные пакеты:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx zip unzip
```

---

## 🟢 Шаг 2. Установка Node.js 20 LTS и PM2

Установите Node.js версии 20 (LTS):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка установленных версий
node -v
npm -v
```

Установите менеджер процессов **PM2**:
```bash
sudo npm install -g pm2
```

---

## 📁 Шаг 3. Загрузка проекта на VDS сервер

1. Создайте директорию проекта и перейдите в неё:
```bash
sudo mkdir -p /var/www/realty-analytics
sudo chown -R $USER:$USER /var/www/realty-analytics
cd /var/www/realty-analytics
```

2. Загрузите файлы проекта:
   - **Вариант А (через Git — обратите внимание на точку `.` в конце!)**:
     ```bash
     # Клонирование сразу в текущую папку /var/www/realty-analytics:
     git clone https://github.com/Justdjscamp/sma.git .
     ```
     *(Если вы клонировали без точки и файлы оказались в папке `sma`, выполните `mv sma/* . && rmdir sma`)*
   - **Вариант Б (через FileZilla / SFTP)**:
     Подключитесь по SFTP (Порт 22, логин `root`, ваш пароль от VDS) и скопируйте все файлы из папки проекта в `/var/www/realty-analytics`.

---

## 📦 Шаг 4. Установка зависимостей и Playwright

1. Установите node-модули:
```bash
npm install
```

2. Установите бинарники Chromium для парсинга через Playwright:
```bash
npx playwright install chromium
```

3. Установите системные зависимости Linux для работы Playwright:
```bash
npx playwright install-deps
```

---

## ⚙️ Шаг 5. Сборка проекта и запуск через PM2

1. Создайте файл окружения `.env`:
```bash
cp .env.example .env
```
*(При необходимости отредактируйте переменные командой `nano .env`)*

2. Выполните сборку Next.js:
```bash
npm run build
```

3. Запустите парсер через PM2:
```bash
pm2 start ecosystem.config.js
```

4. Настройте автозапуск PM2 при перезагрузке VDS сервера:
```bash
pm2 save
pm2 startup
```
*(Скопируйте и выполните команду, которую выдаст терминал после `pm2 startup`)*

---

## 🔒 Шаг 6. Настройка Nginx и SSL для realty-analytics.ru

1. Создайте файл конфигурации Nginx для вашего домена:
```bash
sudo nano /etc/nginx/sites-available/realty-analytics
```

2. Вставьте следующую конфигурацию:
```nginx
server {
    listen 80;
    server_name realty-analytics.ru www.realty-analytics.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты для работы парсера Playwright (60 сек+)
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```
*(Сохраните файл: нажмите `Ctrl + O`, затем `Enter`, затем выберите `Ctrl + X`)*

3. Активируйте сайт и перезапустите Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/realty-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. Выпустите бесплатный **SSL-сертификат (HTTPS)** через Certbot:
```bash
sudo certbot --nginx -d realty-analytics.ru -d www.realty-analytics.ru
```
*(Следуйте указаниям в терминале и введите ваш email для автоматического продления)*

---

## 🎉 Шаг 7. Проверка работы

Ваш парсер и аналитическая платформа **CMA Expert** теперь доступны по адресу:
👉 **`https://realty-analytics.ru`**

### 🛠️ Команды для управления сервисом на VDS:
- **Просмотр статуса работы**: `pm2 status`
- **Логи парсера в реальном времени**: `pm2 logs cma-expert`
- **Перезапуск проекта**: `pm2 restart cma-expert`
- **Остановка**: `pm2 stop cma-expert`
