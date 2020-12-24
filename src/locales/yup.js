export default {
  string: {
    url: () => ({ key: 'invalidURL' }),
  },
  mixed: {
    required: () => ({ key: 'required' }),
    notOneOf: () => ({ key: 'RSSExists' }),
  },
};
