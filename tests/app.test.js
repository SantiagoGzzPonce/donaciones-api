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
