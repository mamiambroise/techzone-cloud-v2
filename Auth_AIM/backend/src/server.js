const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Auth+IAM+Context service démarré sur le port ${env.port}`);
});