export default (i18next) => {
  const form = document.querySelector('[data-form="add-rss"]');
  const fieldElements = {
    link: form.querySelector('[name="link"]'),
  };
  const submitButton = form.querySelector('button');
  const processErrorContainer = document.querySelector('[data-role="process-error"]');
  const processSuccessMessageContainer = document.querySelector('[data-role="process-success"]');
  const feedsContainer = document.querySelector('[data-role="feeds"]');

  const errorMessages = {
    network: {
      error: i18next.t('networkProblems'),
    },
    rss: {
      invalid: i18next.t('invalidRSS'),
    },
  };

  return {
    state: {
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
      feeds: {},
    },
    elements: {
      form,
      fieldElements,
      submitButton,
      processErrorContainer,
      processSuccessMessageContainer,
      feedsContainer,
    },
    errorMessages,
  };
};
