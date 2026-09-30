const { app, request, resetAndSeed, registerUser, adminToken } = require('./helpers');
const userService = require('../src/services/userService');

let admin; let user; let userId;
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeEach(async () => {
  await resetAndSeed();
  admin = await adminToken();
  const r = await registerUser();
  user = r.token; userId = r.user.id;
});

describe('Administración de usuarios', () => {
  it('el admin lista usuarios sin exponer hashes', async () => {
    const res = await request(app).get('/api/users').set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    res.body.users.forEach((u) => expect(u.passwordHash).toBeUndefined());
  });

  it('un usuario normal recibe 403', async () => {
    expect((await request(app).get('/api/users').set(auth(user))).status).toBe(403);
  });

  it('el admin promueve a un usuario y el cambio aplica de inmediato', async () => {
    const res = await request(app).patch(`/api/users/${userId}/role`).set(auth(admin)).send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    // el mismo token ahora tiene permisos de admin porque el rol se lee del servidor
    expect((await request(app).get('/api/users').set(auth(user))).status).toBe(200);
  });

  it('rechaza roles inválidos', async () => {
    const res = await request(app).patch(`/api/users/${userId}/role`).set(auth(admin)).send({ role: 'superadmin' });
    expect(res.status).toBe(400);
  });

  it('el admin no puede cambiar su propio rol', async () => {
    const me = await request(app).get('/api/auth/me').set(auth(admin));
    const res = await request(app).patch(`/api/users/${me.body.user.id}/role`).set(auth(admin)).send({ role: 'usuario' });
    expect(res.status).toBe(400);
  });

  it('devuelve 404 para usuarios inexistentes', async () => {
    const res = await request(app).patch('/api/users/nope/role').set(auth(admin)).send({ role: 'admin' });
    expect(res.status).toBe(404);
  });

  it('seedAdmin es idempotente', async () => {
    const again = await userService.seedAdmin({ name: 'X', email: 'ADMIN@test.com', password: 'Admin123!' });
    expect(again.role).toBe('admin');
    expect(userService.listUsers().filter((u) => u.role === 'admin')).toHaveLength(1);
  });
});
