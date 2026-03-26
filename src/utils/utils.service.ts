import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);
  isPriceInPriceCheck(euroPrice: number, expectedPrice: number) {
    const tolerance = 0.45;

    this.logger.log({
      euroPrice,
      tolerance,
      expectedPrice,
    });

    const unit = Math.abs(euroPrice - expectedPrice) / expectedPrice;
    const priceInRange = unit <= tolerance;

    this.logger.log(`princeInRange = ${priceInRange}`);

    return priceInRange;
  }

  reduceSitemap(urls: string[], query: string): string[] {
    const extractKeywords = (rawUrl: string): string[] => {
      const noQuery = rawUrl.split(/[?#]/)[0].replace(/\/+$/, '');
      const parts = noQuery.split('/').filter(Boolean);

      // grab last non-ID segment (slug)
      let name = decodeURIComponent(parts.pop() || '');
      const looksLikeId = (s: string) =>
        /^[0-9]+$/.test(s) || // numeric
        /^[a-f0-9]{24}$/i.test(s) || // Mongo ObjectId
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          s,
        ) || // UUID
        (!s.includes('-') && /^[A-Za-z0-9_]{6,64}$/.test(s)); // opaque hash-like

      while (name && looksLikeId(name) && parts.length) {
        name = decodeURIComponent(parts.pop() || '');
      }

      if (!name) return [];

      const cleaned = name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’'`]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      return cleaned ? cleaned.split(/\s+/) : [];
    };

    const requiredMatches = (n: number) => Math.max(1, Math.floor(0.65 * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter((k) => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map((url) => ({
        url,
        keywords: extractKeywords(url),
      }));
      const queryKeys = extractKeywords(query);
      const minMatches = requiredMatches(queryKeys.length);
      return products
        .filter((p) => countMatches(p.keywords, queryKeys) >= minMatches)
        .map((p) => p.url);
    };
    const result = filterProducts(urls, query);

    return result;
  }
}
