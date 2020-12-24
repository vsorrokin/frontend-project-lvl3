const getText = (doc, tag) => doc.querySelector(tag).textContent;

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');

  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error(error.textContent);
  }

  return {
    title: getText(doc, 'title'),
    description: getText(doc, 'description'),
    items: [...doc.querySelectorAll('item')].map((item) => ({
      title: getText(item, 'title'),
      link: getText(item, 'link'),
      description: getText(item, 'description'),
    })),
  };
};
