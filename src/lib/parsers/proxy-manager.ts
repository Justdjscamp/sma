import { ProxyConfig } from './parser-types';

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;

  private constructor() {
    // В будущем здесь можно загружать список прокси из ENV или конфига:
    // process.env.PROXY_LIST?.split(',').map(...)
  }

  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  public addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  public setProxies(proxies: ProxyConfig[]): void {
    this.proxies = proxies;
    this.currentIndex = 0;
  }

  public getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  public hasProxies(): boolean {
    return this.proxies.length > 0;
  }
}

export const proxyManager = ProxyManager.getInstance();
