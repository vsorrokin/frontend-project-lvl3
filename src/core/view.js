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
    submitButton,
    processErrorContainer,
    processSuccessMessageContainer,
    feedsContainer,
  },
}, i18next) => {
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
      const feedbackElement = createElement('div.invalid-feedback', error.message);
      element.classList.add('is-invalid');
      element.after(feedbackElement);
    });
  };

  const renderRSS = (feeds) => {
    const values = Object.values(feeds);

    feedsContainer.innerHTML = null;

    const feedsEl = createElement('div.row');
    const feedsCol = createElement('div.col-md-10.col-lg-8.mx-auto');
    const feedsTitle = createElement('h2', i18next.t('feeds'));
    const feedsInfoList = createElement('ul.list-group.mb-5');
    values.forEach(({ title, description }) => {
      const listItem = createElement('li.list-group-item');
      const titleEl = createElement('h3', title);
      const descEl = createElement('p', description);
      listItem.appendChild(titleEl);
      listItem.appendChild(descEl);
      feedsInfoList.appendChild(listItem);
    });
    feedsEl.appendChild(feedsCol);
    feedsCol.appendChild(feedsTitle);
    feedsCol.appendChild(feedsInfoList);

    const postsEl = createElement('div.row');
    const postsCol = createElement('div.col-md-10.col-lg-8.mx-auto');
    const postsTitle = createElement('h2', i18next.t('posts'));
    const postsList = createElement('ul.list-group');
    values
      .reduce((acc, { items }) => [...acc, ...items], [])
      .forEach(({ title, link }) => {
        const listItem = createElement('li.list-group-item.d-flex.justify-content-between.align-items-start');
        const linkEl = createElement('a.font-weight-bold', title, { href: link, target: '_blank' });
        const buttonEl = createElement('button.btn.btn-primary.btn-sm', i18next.t('preview'), {
          type: 'button',
          'data-toggle': 'modal',
          'data-target': '#modal',
        });
        listItem.appendChild(linkEl);
        listItem.appendChild(buttonEl);
        postsList.appendChild(listItem);
      });

    postsEl.appendChild(postsCol);
    postsCol.appendChild(postsTitle);
    postsCol.appendChild(postsList);

    feedsContainer.appendChild(feedsEl);
    feedsContainer.appendChild(postsEl);
  };

  const renderProcessError = (el, error) => {
    el.textContent = error;
  };

  const renderSuccessMessage = (el, text) => {
    el.textContent = text;
  };

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

  return onChange(state, (path, value) => {
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
      case 'feeds':
        renderRSS(value);
        break;
      default:
        break;
    }
  });
};
