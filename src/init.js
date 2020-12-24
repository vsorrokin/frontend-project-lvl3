import 'bootstrap/js/dist/modal';

import i18next from 'i18next';
import resources from './locales';

import initModel from './core/model';
import initView from './core/view';
import initController from './core/controller';

export default () => i18next.init({
  lng: 'en',
  resources,
}).then(() => {
  const model = initModel();
  const watchedState = initView(model, i18next);
  initController(model, watchedState, i18next);
});
