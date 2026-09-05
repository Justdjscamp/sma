import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { proxyManager } from './proxy-manager';

class BrowserPool {
  private static instance: BrowserPool;
  private browser: Browser | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool();
    }
    return BrowserPool.instance;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      // Подождать пока инициализируется
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isInitializing = true;
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
      });
      return this.browser;
    } finally {
      this.isInitializing = false;
    }
  }

  public async getPage(): Promise<{ page: Page; context: BrowserContext }> {
    const browser = await this.getBrowser();
    const proxy = proxyManager.getNextProxy();

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      extraHTTPHeaders: {
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    };

    if (proxy) {
      contextOptions.proxy = {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password,
      };
    }

    const context = await browser.newContext(contextOptions);

    // Блокируем лишние тяжелые ресурсы для ускорения загрузки
    await context.route('**/*.{png,jpg,jpeg,gif,svg,webp,css,woff,woff2,ttf}', (route) => {
      // Оставляем фото если нужно извлечь src, но блокируем загрузку тяжелых стилей/шрифтов если нужно
      route.continue();
    });

    const page = await context.newPage();
    return { page, context };
  }

  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserPool = BrowserPool.getInstance();
