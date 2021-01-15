import * as yup from 'yup';
import {
  uniqueId,
  differenceWith,
} from 'lodash';
import parseRSS from '../libs/rssParser';
import callAPI from '../libs/api';
import yupLocale from '../locales/yup.js';

const validate = (link, schema) => {
  try {
    schema.validateSync(link);
    return null;
  } catch (e) {
    return e;
  }
};

const updateValidationState = (watchedState, baseLinkSchema) => {
  const linkSchema = baseLinkSchema.notOneOf(
    watchedState.feeds.map(({ link }) => link),
  );

  const error = validate(watchedState.form.fields.link, linkSchema);
  watchedState.form.valid = !error;
  watchedState.form.error = watchedState.form.valid ? null : error;
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
    ...items.map((item) => ({ ...item, id: uniqueId() })),
    ...watchedState.posts,
  ];
};

export default ({
  elements: {
    fieldElements,
    form,
  },
}, watchedState) => {
  yup.setLocale(yupLocale);
  const baseLinkSchema = yup.string().url().required();

  Object.entries(fieldElements).forEach(([name, element]) => {
    element.addEventListener('input', (e) => {
      watchedState.form.fields[name] = e.target.value;

      updateValidationState(watchedState, baseLinkSchema);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    watchedState.form.processState = 'sending';

    callAPI(watchedState.form.fields.link).then((res) => {
      try {
        processRSSContent(res.data.contents, watchedState);
      } catch (err) {
        watchedState.form.processState = 'failed';
        return;
      }

      watchedState.form.processState = 'finished';
    }).catch(() => {
      watchedState.form.processState = 'failedNetwork';
    });
  });

  document.addEventListener('click', (e) => {
    const { toggle, id } = e.target.dataset;
    if (toggle !== 'modal') return;

    const currentPost = watchedState.posts.find(({ id: postId }) => postId === id);
    if (!currentPost) return;

    watchedState.modalItem = currentPost;

    watchedState.readPosts = {
      ...watchedState.readPosts,
      [id]: true,
    };
  });

  const updateFeeds = () => {
    const timeout = 5000;

    const promises = watchedState.feeds
      .map(
        ({ link }) => callAPI(link)
          .then((res) => {
            const newPosts = parseRSS(res.data.contents).items;
            const currentPosts = watchedState.posts;
            const diffPosts = differenceWith(newPosts, currentPosts, (a, b) => a.title === b.title);

            if (diffPosts.length) {
              watchedState.posts = [
                ...diffPosts,
                ...watchedState.posts,
              ];
            }
          })
          .catch((e) => console.log(e)),
      );

    Promise.all(promises).finally(() => {
      setTimeout(updateFeeds, timeout);
    });
  };

  updateFeeds();
};
