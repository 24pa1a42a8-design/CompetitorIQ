import { NewsPressAdapter } from './newsPressAdapter.js';
import { ProductReleaseAdapter } from './productReleaseAdapter.js';
import { PricingPageAdapter } from './pricingPageAdapter.js';
import { CareersHiringAdapter } from './careersHiringAdapter.js';
import { SOURCE_CONFIGS } from '../config/sourcesConfig.js';

class SourceAdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  registerDefaultAdapters() {
    this.register('news_press', new NewsPressAdapter());
    this.register('product_release', new ProductReleaseAdapter());
    this.register('pricing_page', new PricingPageAdapter());
    this.register('careers_hiring', new CareersHiringAdapter());
  }

  register(adapterType, adapterInstance) {
    this.adapters.set(adapterType.toLowerCase(), adapterInstance);
  }

  getAdapter(adapterType) {
    if (!adapterType) return this.adapters.get('news_press');
    return this.adapters.get(adapterType.toLowerCase()) || null;
  }

  getSourceConfig(sourceId) {
    return SOURCE_CONFIGS[sourceId] || null;
  }

  listRegisteredAdapters() {
    return Array.from(this.adapters.keys());
  }

  listAvailableSources() {
    return Object.values(SOURCE_CONFIGS);
  }
}

export const adapterRegistry = new SourceAdapterRegistry();
export default adapterRegistry;
