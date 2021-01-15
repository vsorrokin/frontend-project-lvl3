import 'bootstrap/js/dist/modal';

import i18next from 'i18next';
import resources from './locales/index.js';

import initModel from './core/model.js';
import initView from './core/view.js';
import initController from './core/controller.js';

export default () => i18next.init({
  lng: 'en',
  resources,
}).then(() => {
  const model = initModel();
  const watchedState = initView(model, i18next);
  initController(model, watchedState);
});
