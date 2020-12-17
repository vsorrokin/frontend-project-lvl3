/* eslint-disable no-param-reassign, no-console  */
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/js/dist/alert';

import axios from 'axios';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import { keyBy, isEqual } from 'lodash';
import resources from './locales';
import parseRSS from './libs/rssParser';

const schema = yup.object().shape({
  link: yup.string().required().url(),
});

const errorMessages = {
  network: {
    error: 'Network Problems. Try again.',
  },
  rss: {
    invalid: 'This source doesn\'t contain valid rss',
  },
};

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

const renderErrors = (elements, errors) => {
  Object.entries(elements).forEach(([name, element]) => {
    const errorElement = element.nextElementSibling;
    const error = errors[name];
    if (errorElement) {
      element.classList.remove('is-invalid');
      errorElement.remove();
    }
    if (!error) {
      return;
    }
    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('invalid-feedback');
    feedbackElement.innerHTML = error.message;
    element.classList.add('is-invalid');
    element.after(feedbackElement);
  });
};

const renderProcessError = (el, error) => {
  el.textContent = error;
};

const renderSuccessMessage = (el, text) => {
  el.textContent = text;
};

(() => {
  const state = {
    form: {
      processState: 'filling',
      errors: {},
      processError: null,
      processSuccessMessage: null,
      valid: true,
      fields: {
        link: null,
      },
    },
  };

  const form = document.querySelector('[data-form="add-rss"]');
  const fieldElements = {
    link: form.querySelector('[name="link"]'),
  };
  const submitButton = form.querySelector('button');
  const processErrorContainer = document.querySelector('[data-role="process-error"]');
  const processSuccessMessageContainer = document.querySelector('[data-role="process-success"]');

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        break;
      case 'filling':
        submitButton.disabled = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        fieldElements.link.value = null;
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.valid':
        submitButton.disabled = !value;
        break;
      case 'form.errors':
        renderErrors(fieldElements, value);
        break;
      case 'form.processError':
        renderProcessError(processErrorContainer, value);
        break;
      case 'form.processSuccessMessage':
        renderSuccessMessage(processSuccessMessageContainer, value);
        break;
      default:
        break;
    }
  });

  const getRSSContent = (data) => {
    const RSSContent = parseRSS(data);
  };

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
    const rssLink = encodeURIComponent(watchedState.form.fields.link);
    axios.get(`https://api.allorigins.win/get?url=${rssLink}`).then((res) => {
      try {
        getRSSContent(res.data.contents);
      } catch (err) {
        watchedState.form.processError = errorMessages.rss.invalid;
        watchedState.form.processState = 'failed';
        return;
      }

      watchedState.form.processState = 'finished';
      watchedState.form.processSuccessMessage = 'Rss has been loaded';
    }).catch((err) => {
      watchedState.form.processError = errorMessages.network.error;
      watchedState.form.processState = 'failed';
      throw err;
    });
  });

  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {

  });
})();
