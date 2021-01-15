import onChange from 'on-change';

const createElement = (selector, textContent = null, attrs = {}) => {
  const [tag, ...classes] = selector.split('.');
  const el = document.createElement(tag);
  el.classList.add(...classes);
  el.textContent = textContent;
  Object.entries(attrs).forEach(([attr, value]) => {
    el.setAttribute(attr, value);
  });
  return el;
};

export default ({
  state,
  elements: {
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
}, i18next) => {
  const renderError = (error) => {
    const linkEl = fieldElements.link;
    linkEl.classList.remove('is-invalid');
    if (!error) {
      return;
    }
    linkError.textContent = i18next.t(error.message.key);
    linkEl.classList.add('is-invalid');
  };

  const renderFeeds = (feeds) => {
    feedsContainer.innerHTML = null;

    const feedsTitle = createElement('h2', i18next.t('feeds'));
    const feedsInfoList = createElement('ul.list-group.mb-5');
    feeds.forEach(({ title, description }) => {
      const listItem = createElement('li.list-group-item');
      const titleEl = createElement('h3', title);
      const descEl = createElement('p', description);
      listItem.appendChild(titleEl);
      listItem.appendChild(descEl);
      feedsInfoList.appendChild(listItem);
    });

    feedsContainer.appendChild(feedsTitle);
    feedsContainer.appendChild(feedsInfoList);
  };

  const renderPosts = () => {
    const { posts, readPosts } = state;
    postsContainer.innerHTML = null;

    const postsTitle = createElement('h2', i18next.t('posts'));
    const postsList = createElement('ul.list-group');

    posts
      .forEach(({
        id,
        title,
        link,
      }) => {
        const listItem = createElement('li.list-group-item.d-flex.justify-content-between.align-items-start');
        const linkClass = readPosts[id] ? '' : '.font-weight-bold';
        const linkEl = createElement(`a${linkClass}`, title, {
          href: link,
          target: '_blank',
          'data-testid': 'post-link',
        });
        const buttonEl = createElement('button.btn.btn-primary.btn-sm', i18next.t('preview'), {
          type: 'button',
          'data-toggle': 'modal',
          'data-target': '#modal',
          'data-id': id,
          'data-testid': 'preview',
        });
        listItem.appendChild(linkEl);
        listItem.appendChild(buttonEl);
        postsList.appendChild(listItem);
      });

    postsContainer.appendChild(postsTitle);
    postsContainer.appendChild(postsList);
  };

  const renderProcessError = (text) => {
    processErrorContainer.textContent = text;
  };

  const renderSuccessMessage = (text) => {
    processSuccessMessageContainer.textContent = text;
  };

  const renderModal = ({ description, title, link } = {}) => {
    modalBody.textContent = description;
    modalTitle.textContent = title;
    modalLink.setAttribute('href', link);
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failedNetwork':
        submitButton.disabled = false;
        fieldElements.link.readOnly = false;
        renderProcessError(i18next.t('networkProblems'));
        break;
      case 'failed':
        submitButton.disabled = false;
        fieldElements.link.readOnly = false;
        renderProcessError(i18next.t('invalidRSS'));
        break;
      case 'filling':
        submitButton.disabled = false;
        fieldElements.link.readOnly = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        fieldElements.link.readOnly = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        fieldElements.link.readOnly = false;
        fieldElements.link.value = null;
        renderSuccessMessage(i18next.t('sucessRSSLoad'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  return onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        renderProcessError(null);
        renderSuccessMessage(null);
        processStateHandler(value);
        break;
      case 'form.valid':
        submitButton.disabled = !value;
        break;
      case 'form.error':
        renderError(value);
        break;
      case 'feeds':
        renderFeeds(value);
        break;
      case 'posts':
      case 'readPosts':
        renderPosts();
        break;
      case 'modalItem':
        renderModal(value);
        break;
      default:
        break;
    }
  });
};
