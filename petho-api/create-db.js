const { Client } = require('pg');

async function main() {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1026161053',
    database: 'postgres',
  });

  try {
    await c.connect();
    console.log('Conectado a PostgreSQL OK');
    
    try {
      await c.query('CREATE DATABASE "pethoV8"');
      console.log('Base de datos pethoV8 creada exitosamente!');
    } catch (e) {
      if (e.code === '42P04') {
        console.log('La base de datos pethoV8 ya existe - OK');
      } else {
        console.log('Error creando DB:', e.message);
      }
    }
  } catch (e) {
    console.log('Error de conexion:', e.message);
  } finally {
    await c.end();
  }
}

main();
