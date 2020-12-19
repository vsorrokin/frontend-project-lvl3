export default (i18next) => {
  const form = document.querySelector('[data-form="add-rss"]');
  const fieldElements = {
    link: form.querySelector('[name="link"]'),
  };
  const submitButton = form.querySelector('button');
  const processErrorContainer = document.querySelector('[data-role="process-error"]');
  const processSuccessMessageContainer = document.querySelector('[data-role="process-success"]');
  const feedsContainer = document.querySelector('[data-role="feeds"]');
  const modalBody = document.querySelector('[data-role="modal-body"]');
  const modalTitle = document.querySelector('[data-role="modal-title"]');
  const modalLink = document.querySelector('[data-role="modal-link"]');

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
      modalItem: null,
    },
    elements: {
      form,
      fieldElements,
      submitButton,
      processErrorContainer,
      processSuccessMessageContainer,
      feedsContainer,
      modalBody,
      modalTitle,
      modalLink,
    },
    errorMessages,
  };
};
