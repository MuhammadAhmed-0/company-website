import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const publicDir = path.resolve(__dirname, 'public');

app.use(express.static(publicDir, { extensions: ['html'] }));

app.use(function(req, res) {
  res.status(404).sendFile(path.join(publicDir, 'index.html'));
});

app.listen(5000, '0.0.0.0', function() {
  console.log('Serving on port 5000');
});
