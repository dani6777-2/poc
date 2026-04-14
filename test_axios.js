const axios = require('axios');
console.log(axios.getUri({ baseURL: 'http://localhost:8000/api/v3', url: '/auth/login' }));
