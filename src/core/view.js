import onChange from 'on-change';

export default ({
  state,
  elements: {
    fieldElements,
    submitButton,
    processErrorContainer,
    processSuccessMessageContainer,
  },
}) => {
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
      default:
        break;
    }
  });
};
