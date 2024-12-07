import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bfp-caraga-1.onrender.com', 
});

export default api;