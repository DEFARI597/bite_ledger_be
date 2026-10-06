require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const dbUrl = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?sslmode=${process.env.DB_SSLMODE || 'disable'}`;

const pool = new Pool({
  connectionString: dbUrl,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed To Connect', err.message);
    return;
  }
  console.log('Connect Successfully !');
  release();
});

module.exports = pool;
