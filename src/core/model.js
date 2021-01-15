export default () => {
  const form = document.querySelector('[data-form="add-rss"]');
  const fieldElements = {
    link: form.querySelector('[name="url"]'),
  };
  const linkError = document.querySelector('[data-role="link-error"]');
  const submitButton = form.querySelector('button');
  const processErrorContainer = document.querySelector('[data-role="process-error"]');
  const processSuccessMessageContainer = document.querySelector('[data-role="process-success"]');
  const feedsContainer = document.querySelector('#feeds');
  const postsContainer = document.querySelector('#posts');
  const modalBody = document.querySelector('[data-role="modal-body"]');
  const modalTitle = document.querySelector('[data-role="modal-title"]');
  const modalLink = document.querySelector('[data-role="modal-link"]');

  return {
    state: {
      form: {
        processState: 'filling',
        error: null,
        valid: true,
        fields: {
          link: null,
        },
      },
      feeds: [],
      posts: [],
      readPosts: {},
      modalItem: null,
    },
    elements: {
      form,
      fieldElements,
      linkError,
      submitButton,
      processErrorContainer,
      processSuccessMessageContainer,
      feedsContainer,
      postsContainer,
      modalBody,
      modalTitle,
      modalLink,
    },
  };
};
