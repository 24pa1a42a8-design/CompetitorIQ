import { BaseSourceAdapter } from './baseAdapter.js';

export class ProductReleaseAdapter extends BaseSourceAdapter {
  constructor() {
    super('ProductReleaseAdapter', 'PRODUCT');
  }
}

export default ProductReleaseAdapter;
