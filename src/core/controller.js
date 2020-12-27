import * as yup from 'yup';
import {
  keyBy,
  isEqual,
  uniqueId,
  differenceWith,
} from 'lodash';
import parseRSS from '../libs/rssParser';
import callAPI from '../libs/api';
import yupLocale from '../locales/yup.js';

const validate = (fields, schema) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
};

const updateValidationState = (watchedState) => {
  const baseLinkSchema = yup.string().url().required();
  const linkSchema = baseLinkSchema.notOneOf(
    watchedState.feeds.map(({ link }) => link),
  );
  const schema = yup.object().shape({ link: linkSchema });

  const errors = validate(watchedState.form.fields, schema);
  watchedState.form.valid = isEqual(errors, {});
  watchedState.form.errors = errors;
};

const processRSSContent = (data, watchedState) => {
  const { title, description, items } = parseRSS(data);
  const { link: feedLink } = watchedState.form.fields;
  watchedState.feeds = [{
    link: feedLink,
    title,
    description,
  }, ...watchedState.feeds];

  watchedState.posts = [
    ...items.map((item) => ({ ...item, id: uniqueId(), read: false })),
    ...watchedState.posts,
  ];
};

export default ({
  elements: {
    fieldElements,
    form,
  },
}, watchedState, i18next) => {
  const errorMessages = {
    network: {
      error: i18next.t('networkProblems'),
    },
    rss: {
      invalid: i18next.t('invalidRSS'),
    },
  };

  yup.setLocale(yupLocale);

  Object.entries(fieldElements).forEach(([name, element]) => {
    element.addEventListener('input', (e) => {
      watchedState.form.fields[name] = e.target.value;
      watchedState.form.processError = null;
      watchedState.form.processSuccessMessage = null;

      updateValidationState(watchedState);
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

    const currentPost = watchedState.posts.find(({ id: postId }) => postId === id);
    if (!currentPost) return;

    watchedState.modalItem = currentPost;

    watchedState.posts = watchedState.posts.map((post) => {
      if (post.id === id) {
        return { ...post, read: true };
      }
      return post;
    });
  });

  const updateFeeds = () => {
    const timeout = 5000;

    Promise.all(watchedState.feeds.map(({ link }) => callAPI(link))).then((res) => {
      const newPosts = res.flatMap(({ data: { contents } }) => parseRSS(contents).items);
      const currentPosts = watchedState.posts;
      const diffPosts = differenceWith(newPosts, currentPosts, (a, b) => a.title === b.title);

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
