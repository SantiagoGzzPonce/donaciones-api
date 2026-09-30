const jwt = require('jsonwebtoken');
const { app, request, resetAndSeed, registerUser, adminToken, ADMIN } = require('./helpers');

beforeEach(resetAndSeed);

describe('POST /api/auth/register', () => {
  it('registra un usuario con rol "usuario" y devuelve token', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Ana López', email: 'Ana@Correo.com', password: 'Segura123' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'ana@correo.com', role: 'usuario' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.token).toBeDefined();
  });

  it('ignora el intento de auto-asignarse rol admin (escalamiento de privilegios)', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Malicioso', email: 'm@x.com', password: 'Segura123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('usuario');
  });

  it('rechaza correos duplicados', async () => {
    await registerUser('dup@x.com');
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'Otro', email: 'dup@x.com', password: 'Segura123' });
    expect(res.status).toBe(409);
  });

  it('rechaza datos inválidos con detalle de errores', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  it('inicia sesión con credenciales correctas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password });
    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.token, 'secreto-de-pruebas');
    expect(payload.role).toBe('admin');
  });

  it('rechaza contraseña incorrecta', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'Mala1234' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('rechaza usuario inexistente con el mismo mensaje genérico', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nadie@x.com', password: 'Algo1234' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('rechaza payloads de inyección (NoSQL/SQL) en login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: "' OR '1'='1" });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me y middleware authenticate', () => {
  it('devuelve el usuario autenticado', async () => {
    const token = await adminToken();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ADMIN.email);
  });

  it('rechaza peticiones sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token no proporcionado');
  });

  it('rechaza esquemas distintos a Bearer', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
  });

  it('rechaza tokens firmados con otro secreto', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'admin' }, 'otro-secreto');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido o expirado');
  });

  it('rechaza tokens con algoritmo "none"', async () => {
    const unsigned = jwt.sign({ sub: 'x', role: 'admin' }, null, { algorithm: 'none' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });

  it('rechaza tokens expirados', async () => {
    const expired = jwt.sign({ sub: 'x', role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 }, 'secreto-de-pruebas');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('rechaza tokens válidos de usuarios que ya no existen', async () => {
    const token = jwt.sign({ sub: 'id-inexistente', role: 'admin' }, 'secreto-de-pruebas');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
