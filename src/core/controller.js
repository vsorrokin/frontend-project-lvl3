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
  const { title, description, items } = parseRSS(data);

  watchedState.feeds = [{
    link: normalizeUrl(watchedState.form.fields.link),
    title,
    description,
  }, ...watchedState.feeds];

  watchedState.posts = [
    ...items.map((item) => ({ ...item, id: uniqueId() })),
    ...watchedState.posts,
  ];
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
      .test('rssExists', i18next.t('RSSExists'), (val) => !watchedState.feeds.find(({ link }) => normalizeUrl(link) === val)),
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

    watchedState.modalItem = watchedState.posts.find(({ id: itemId }) => itemId === id);

    e.target.parentElement.querySelector('a').classList.remove('font-weight-bold');
  });

  const updateFeeds = () => {
    const timeout = 5000;
    const feedLinks = watchedState.feeds.map((it) => it.link);

    if (!feedLinks.length) {
      setTimeout(updateFeeds, timeout);
      return;
    }

    Promise.all(feedLinks.map((link) => callAPI(link))).then((res) => {
      const newPosts = res.flatMap(({ data: { contents } }) => parseRSS(contents).items);
      const currentPosts = watchedState.posts;

      const diffPosts = newPosts.filter(
        ({ title }) => !currentPosts.find((it) => it.title === title),
      ).map((item) => ({ ...item, id: uniqueId() }));

      if (diffPosts.length) {
        watchedState.posts = [
          ...diffPosts,
          ...watchedState.posts,
        ];
      }
    }).finally(() => {
      setTimeout(updateFeeds, timeout);
    });
  };

  updateFeeds();
};
