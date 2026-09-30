const { app, request } = require('./helpers');
const { errorHandler } = require('../src/middleware/errorHandler');

describe('Aplicación y seguridad HTTP', () => {
  it('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toEqual({ status: 'ok', env: 'test' });
  });

  it('incluye cabeceras de seguridad y oculta X-Powered-By', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('responde 404 JSON para rutas desconocidas', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Recurso no encontrado');
  });

  it('responde 400 ante JSON mal formado', async () => {
    const res = await request(app).post('/api/auth/login')
      .set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON mal formado');
  });

  it('responde 413 ante cuerpos demasiado grandes', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x'.repeat(20000) });
    expect(res.status).toBe(413);
  });

  it('sirve la página estática', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Registro de donantes');
  });

  it('oculta el detalle de errores 500', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorHandler(new Error('detalle interno'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});

describe('Correcciones derivadas del escaneo OWASP ZAP', () => {
  it('CSP sin comodines en font-src (alerta 10055)', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("font-src 'self'");
    expect(csp).not.toMatch(/font-src[^;]*https:/);
  });

  it('no envía Access-Control-Allow-Origin: * por defecto (alerta 10098)', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://atacante.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('envía Permissions-Policy (alerta 10063)', async () => {
    const res = await request(app).get('/');
    expect(res.headers['permissions-policy']).toContain('camera=()');
  });

  it('las respuestas de la API no se guardan en caché', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('los formularios usan POST para no exponer credenciales en la URL (alerta 10024)', async () => {
    const res = await request(app).get('/');
    expect(res.text).not.toMatch(/<form id="[a-z]+-form">/);
    expect(res.text.match(/method="post"/g)).toHaveLength(3);
  });

  it('permite orígenes CORS configurados explícitamente', async () => {
    let appCors;
    jest.isolateModules(() => {
      process.env.CORS_ORIGIN = 'https://ong-aliada.org, https://otra.org';
      appCors = require('../src/app');
      delete process.env.CORS_ORIGIN;
    });
    const ok = await request(appCors).get('/health').set('Origin', 'https://ong-aliada.org');
    expect(ok.headers['access-control-allow-origin']).toBe('https://ong-aliada.org');
    const bad = await request(appCors).get('/health').set('Origin', 'https://atacante.com');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Configuración de producción', () => {
  const run = (vars) => () => jest.isolateModules(() => {
    const backup = { ...process.env };
    Object.assign(process.env, { NODE_ENV: 'production' }, vars);
    try { require('../src/config'); } finally { process.env = backup; }
  });

  it('exige JWT_SECRET', () => {
    expect(run({ JWT_SECRET: '', ADMIN_PASSWORD: 'Seguro123' })).toThrow('JWT_SECRET es obligatorio');
  });

  it('exige ADMIN_PASSWORD (sin credenciales por defecto)', () => {
    expect(run({ JWT_SECRET: 'x', ADMIN_PASSWORD: '' })).toThrow('ADMIN_PASSWORD es obligatorio');
  });

  it('arranca con las variables obligatorias', () => {
    expect(run({ JWT_SECRET: 'x', ADMIN_PASSWORD: 'Seguro123' })).not.toThrow();
  });
});
