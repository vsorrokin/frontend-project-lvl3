import 'bootstrap/dist/css/bootstrap.min.css';

import i18next from 'i18next';
import resources from './locales';

import initModel from './core/model';
import initView from './core/view';
import initController from './core/controller';

i18next.init({
  lng: 'en',
  debug: true,
  resources,
}).then(() => {
  const model = initModel(i18next);
  const watchedState = initView(model);
  initController(model, watchedState, i18next);
});
