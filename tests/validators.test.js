const v = require('../src/utils/validators');

describe('validators', () => {
  describe('validatePassword', () => {
    it('acepta una contraseña robusta', () => expect(v.validatePassword('Segura123')).toEqual([]));
    it('rechaza contraseñas cortas o no string', () => {
      expect(v.validatePassword('Ab1')).toHaveLength(1);
      expect(v.validatePassword(12345678)).toHaveLength(1);
    });
    it('rechaza contraseñas sin complejidad', () => {
      expect(v.validatePassword('solominusculas1')[0]).toMatch(/mayúsculas/);
    });
  });

  describe('validateRegister', () => {
    it('acepta datos válidos', () => {
      expect(v.validateRegister({ name: 'Ana López', email: 'ana@x.com', password: 'Segura123' })).toEqual([]);
    });
    it('rechaza cuerpo vacío o indefinido', () => {
      expect(v.validateRegister().length).toBe(3);
    });
    it('rechaza nombres con etiquetas HTML (XSS)', () => {
      const errs = v.validateRegister({ name: '<script>alert(1)</script>', email: 'a@b.com', password: 'Segura123' });
      expect(errs).toContain('Nombre inválido (2-100 caracteres, sin símbolos especiales)');
    });
  });

  describe('validateLogin', () => {
    it('exige correo y contraseña', () => {
      expect(v.validateLogin({})).toHaveLength(2);
      expect(v.validateLogin()).toHaveLength(2);
      expect(v.validateLogin({ email: 'a@b.com', password: 'x' })).toEqual([]);
    });
  });

  describe('validateDonor', () => {
    const ok = { name: 'Banco de Alimentos', email: 'ba@org.mx', type: 'empresa' };
    it('acepta un donante válido', () => expect(v.validateDonor(ok)).toEqual([]));
    it('rechaza cuerpo vacío en modo completo', () => expect(v.validateDonor().length).toBe(3));
    it('valida tipo, teléfono, dirección y notas', () => {
      const errs = v.validateDonor({ ...ok, type: 'otro', phone: 'abc', address: '<b>x</b>', notes: 'y'.repeat(501) });
      expect(errs).toHaveLength(4);
    });
    it('rechaza teléfono, dirección y notas que no son texto', () => {
      expect(v.validateDonor({ ...ok, phone: 123, address: 1, notes: {} })).toHaveLength(3);
    });
    it('rechaza intentos de SQLi en el correo', () => {
      expect(v.validateDonor({ ...ok, email: "' OR 1=1 --" })).toContain('Correo del donante inválido');
    });
    it('en modo parcial solo valida los campos presentes', () => {
      expect(v.validateDonor({ phone: '8112345678' }, { partial: true })).toEqual([]);
      expect(v.validateDonor({ name: 'x' }, { partial: true })).toHaveLength(1);
      expect(v.validateDonor({ email: 'mal' }, { partial: true })).toHaveLength(1);
      expect(v.validateDonor({ type: 'x' }, { partial: true })).toHaveLength(1);
    });
    it('en modo parcial rechaza un cuerpo vacío', () => {
      expect(v.validateDonor({}, { partial: true })).toEqual(['No se enviaron campos para actualizar']);
    });
  });

  describe('validateRole', () => {
    it('acepta roles válidos y rechaza otros', () => {
      expect(v.validateRole('admin')).toEqual([]);
      expect(v.validateRole('usuario')).toEqual([]);
      expect(v.validateRole('root')).toHaveLength(1);
    });
  });
});
