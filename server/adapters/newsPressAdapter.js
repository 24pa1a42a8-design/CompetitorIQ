import { BaseSourceAdapter } from './baseAdapter.js';

export class NewsPressAdapter extends BaseSourceAdapter {
  constructor() {
    super('NewsPressAdapter', 'ANNOUNCEMENT');
  }
}

export default NewsPressAdapter;
