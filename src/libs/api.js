import axios from 'axios';

export const BASE_URL = 'https://api.allorigins.win';
export const ENDPOINT = '/get';

export default (url) => axios.get(`${BASE_URL}${ENDPOINT}`, { params: { url } });
