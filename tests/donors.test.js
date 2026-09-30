const { app, request, resetAndSeed, registerUser, adminToken, donor } = require('./helpers');

let admin; let userA; let userB;

beforeEach(async () => {
  await resetAndSeed();
  admin = await adminToken();
  userA = (await registerUser('a@test.com', 'Usuario A')).token;
  userB = (await registerUser('b@test.com', 'Usuario B')).token;
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const createAs = (token, data = donor()) => request(app).post('/api/donors').set(auth(token)).send(data);

describe('Registro de donantes', () => {
  it('requiere autenticación', async () => {
    expect((await request(app).get('/api/donors')).status).toBe(401);
  });

  it('un usuario crea un donante', async () => {
    const res = await createAs(userA);
    expect(res.status).toBe(201);
    expect(res.body.donor).toMatchObject({ name: 'Supermercado La Esperanza', type: 'empresa' });
    expect(res.body.donor.id).toBeDefined();
  });

  it('normaliza el correo y recorta espacios', async () => {
    const res = await createAs(userA, donor({ email: '  MAYUS@Correo.MX ', name: '  Juan Pérez  ' }));
    expect(res.body.donor.email).toBe('mayus@correo.mx');
    expect(res.body.donor.name).toBe('Juan Pérez');
  });

  it('rechaza donantes con correo duplicado', async () => {
    await createAs(userA);
    const res = await createAs(userB);
    expect(res.status).toBe(409);
  });

  it('rechaza contenido con scripts (XSS almacenado)', async () => {
    const res = await createAs(userA, donor({ notes: '<img src=x onerror=alert(1)>' }));
    expect(res.status).toBe(400);
  });

  it('ignora campos no permitidos como createdBy', async () => {
    const res = await createAs(userA, { ...donor(), createdBy: 'otro-id', isAdmin: true });
    expect(res.body.donor.isAdmin).toBeUndefined();
    expect(res.body.donor.createdBy).not.toBe('otro-id');
  });
});

describe('Consulta de donantes por rol', () => {
  beforeEach(async () => {
    await createAs(userA, donor({ email: 'a1@x.mx', name: 'Panadería Norte', type: 'empresa' }));
    await createAs(userB, donor({ email: 'b1@x.mx', name: 'María García', type: 'persona' }));
  });

  it('el usuario solo ve sus propios donantes', async () => {
    const res = await request(app).get('/api/donors').set(auth(userA));
    expect(res.body.donors).toHaveLength(1);
    expect(res.body.donors[0].name).toBe('Panadería Norte');
  });

  it('el administrador ve todos los donantes', async () => {
    const res = await request(app).get('/api/donors').set(auth(admin));
    expect(res.body.donors).toHaveLength(2);
  });

  it('filtra por tipo y por texto de búsqueda', async () => {
    const byType = await request(app).get('/api/donors?type=persona').set(auth(admin));
    expect(byType.body.donors).toHaveLength(1);
    const byName = await request(app).get('/api/donors?q=panad').set(auth(admin));
    expect(byName.body.donors).toHaveLength(1);
    const byEmail = await request(app).get('/api/donors?q=b1@').set(auth(admin));
    expect(byEmail.body.donors[0].name).toBe('María García');
  });

  it('trata payloads de SQLi en la búsqueda como texto literal', async () => {
    const res = await request(app).get("/api/donors?q=' OR 1=1 --").set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.donors).toHaveLength(0);
  });
});

describe('Detalle, edición y borrado', () => {
  let id;
  beforeEach(async () => { id = (await createAs(userA)).body.donor.id; });

  it('el dueño consulta su donante', async () => {
    const res = await request(app).get(`/api/donors/${id}`).set(auth(userA));
    expect(res.status).toBe(200);
  });

  it('otro usuario recibe 403 (control de acceso IDOR)', async () => {
    const res = await request(app).get(`/api/donors/${id}`).set(auth(userB));
    expect(res.status).toBe(403);
  });

  it('devuelve 404 si no existe', async () => {
    const res = await request(app).get('/api/donors/no-existe').set(auth(admin));
    expect(res.status).toBe(404);
  });

  it('el dueño actualiza parcialmente', async () => {
    const res = await request(app).put(`/api/donors/${id}`).set(auth(userA)).send({ phone: '8187654321' });
    expect(res.status).toBe(200);
    expect(res.body.donor.phone).toBe('8187654321');
  });

  it('otro usuario no puede actualizar', async () => {
    const res = await request(app).put(`/api/donors/${id}`).set(auth(userB)).send({ phone: '8187654321' });
    expect(res.status).toBe(403);
  });

  it('rechaza actualizar a un correo ya usado por otro donante', async () => {
    await createAs(userA, donor({ email: 'otro@x.mx' }));
    const res = await request(app).put(`/api/donors/${id}`).set(auth(userA)).send({ email: 'otro@x.mx' });
    expect(res.status).toBe(409);
  });

  it('permite conservar el mismo correo al actualizar', async () => {
    const res = await request(app).put(`/api/donors/${id}`).set(auth(userA)).send({ email: 'contacto@esperanza.mx' });
    expect(res.status).toBe(200);
  });

  it('un usuario no puede borrar (solo admin)', async () => {
    const res = await request(app).delete(`/api/donors/${id}`).set(auth(userA));
    expect(res.status).toBe(403);
  });

  it('el administrador borra y luego da 404', async () => {
    expect((await request(app).delete(`/api/donors/${id}`).set(auth(admin))).status).toBe(204);
    expect((await request(app).delete(`/api/donors/${id}`).set(auth(admin))).status).toBe(404);
  });
});
