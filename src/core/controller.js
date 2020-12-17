import * as yup from 'yup';
import axios from 'axios';
import { keyBy, isEqual } from 'lodash';
import parseRSS from '../libs/rssParser';

const schema = yup.object().shape({
  link: yup.string().required().url(),
});

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return {};
  } catch (e) {
    return keyBy(e.inner, 'path');
  }
};

const updateValidationState = (watchedState) => {
  const errors = validate(watchedState.form.fields);
  watchedState.form.valid = isEqual(errors, {});
  watchedState.form.errors = errors;
};

const processRSSContent = (data) => {
  const RSSContent = parseRSS(data);
};

const genRequestLink = (link) => {
  const encodedLink = encodeURIComponent(link);
  return `https://api.allorigins.win/get?url=${encodedLink}`;
};

export default ({
  elements: {
    fieldElements,
    form,
  },
  errorMessages,
}, watchedState, i18next) => {
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

    axios.get(genRequestLink(watchedState.form.fields.link)).then((res) => {
      try {
        processRSSContent(res.data.contents);
      } catch (err) {
        watchedState.form.processError = errorMessages.rss.invalid;
        watchedState.form.processState = 'failed';
        return;
      }

      watchedState.form.processState = 'finished';
      watchedState.form.processSuccessMessage = i18next.t('sucessRSSLoad');
    }).catch((err) => {
      watchedState.form.processError = errorMessages.network.error;
      watchedState.form.processState = 'failed';
      throw err;
    });
  });
};
