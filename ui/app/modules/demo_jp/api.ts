import axios from 'axios';

const BASE_URL = '/api/demo_jp';

export const demoJpApi = {
  getAll() {
    return axios.get(BASE_URL);
  },

  getById(id: number) {
    return axios.get(`${BASE_URL}/${id}`);
  },

  create(data: any) {
    return axios.post(BASE_URL, data);
  },

  update(id: number, data: any) {
    return axios.put(`${BASE_URL}/${id}`, data);
  },

  remove(id: number) {
    return axios.delete(`${BASE_URL}/${id}`);
  },
};
