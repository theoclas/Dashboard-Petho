const axios = require('axios');
axios.post('http://localhost:3001/api/auth/login', { username: 'Administrador', password: 'admin123' })
  .then(res => console.log('SUCCESS:', res.data))
  .catch(err => console.log('ERROR:', err.response ? err.response.data : err.message));
