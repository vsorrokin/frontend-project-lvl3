import * as yup from 'yup';
import normalizeUrl from 'normalize-url';
import { keyBy, isEqual, uniqueId } from 'lodash';
import parseRSS from '../libs/rssParser';
import callAPI from '../libs/api';

const validate = (fields, schema) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
};

const updateValidationState = (watchedState, schema) => {
  const errors = validate(watchedState.form.fields, schema);
  watchedState.form.valid = isEqual(errors, {});
  watchedState.form.errors = errors;
};

const processRSSContent = (data, watchedState) => {
  const parsedRSS = parseRSS(data);
  watchedState.feeds = {
    ...watchedState.feeds,
    [normalizeUrl(watchedState.form.fields.link)]: {
      ...parsedRSS,
      items: parsedRSS.items.map((item) => ({ ...item, id: uniqueId() })),
    },
  };
};

export default ({
  elements: {
    fieldElements,
    form,
  },
  errorMessages,
}, watchedState, i18next) => {
  const schema = yup.object().shape({
    link: yup
      .string()
      .required()
      .url(i18next.t('invalidURL'))
      .test('rssExists', i18next.t('RSSExists'), (val) => !watchedState.feeds[normalizeUrl(val)]),
  });

  Object.entries(fieldElements).forEach(([name, element]) => {
    element.addEventListener('input', (e) => {
      watchedState.form.fields[name] = e.target.value;
      watchedState.form.processError = null;
      watchedState.form.processSuccessMessage = null;

      updateValidationState(watchedState, schema);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    watchedState.form.processState = 'sending';
    callAPI(watchedState.form.fields.link).then((res) => {
      try {
        processRSSContent(res.data.contents, watchedState);
      } catch (err) {
        watchedState.form.processError = errorMessages.rss.invalid;
        watchedState.form.processState = 'failed';
        return;
      }

      watchedState.form.processState = 'finished';
      watchedState.form.processSuccessMessage = i18next.t('sucessRSSLoad');
    }).catch(() => {
      watchedState.form.processError = errorMessages.network.error;
      watchedState.form.processState = 'failed';
    });
  });

  document.addEventListener('click', (e) => {
    const { toggle, id } = e.target.dataset;
    if (toggle !== 'modal') return;

    watchedState.modalItem = Object.values(watchedState.feeds)
      .reduce((acc, { items }) => [...acc, ...items], [])
      .find(({ id: itemId }) => itemId === id);

    e.target.parentElement.querySelector('a').classList.remove('font-weight-bold');
  });
};
