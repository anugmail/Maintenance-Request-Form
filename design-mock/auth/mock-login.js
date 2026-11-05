/* จำลองการ login ของ VMS Plus สำหรับต้นแบบ (30 ต.ค. 2569)
   ทำเหมือนระบบจริง: หลัง POST login/authen-keycloak แอปเก็บ accessToken · refreshToken · idTokenHint ใน localStorage
   แล้วเรียก GET /api/login/profile — ที่นี่อ่านจาก personas.json (สร้างด้วย build-personas.js) แทน API
   ใช้: <script src="auth/mock-login.js"></script> แล้ว await MockAuth.loginAs('kbk') · MockAuth.claims() · MockAuth.hasRole('admin-super')
   persona: kbk (กบค. แก้ไข) · kry (กรย. ดูในเขต) · owner (หน่วยงานเจ้าของรถ ดู + ตอบนัด) · none (ไม่มีสิทธิ์ Overhaul) */
(function () {
  const KEYS = ['accessToken', 'refreshToken', 'idTokenHint'];   // ชื่อ key เดียวกับระบบจริง
  const SRC = (document.currentScript && document.currentScript.src.replace(/mock-login\.js.*$/, '')) || 'auth/';
  let cache = null;
  const load = async () => cache || (cache = await (await fetch(SRC + 'personas.json')).json());
  const decode = (t) => { try { return JSON.parse(decodeURIComponent(escape(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } };
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };

  window.MockAuth = {
    async personas() { return (await load()).personas; },
    async loginAs(id) {   // = authen-keycloak สำเร็จ
      const p = (await load()).personas.find(x => x.id === id);
      if (!p) throw new Error('ไม่มี persona ' + id);
      try { KEYS.forEach(k => localStorage.setItem(k, p.login_response[k])); } catch (e) {}
      return p.login_response;
    },
    logout() { try { KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) {} },
    claims() { const t = get('accessToken'); return t ? decode(t) : null; },   // ข้อมูลใน accessToken (roles · dept_sap · business_area)
    async profile() {   // = GET /api/login/profile
      const c = this.claims(); if (!c) return null;
      const p = (await load()).personas.find(x => x.access_token_claims.emp_id === c.emp_id);
      return p ? p.profile : null;
    },
    hasRole(r) { const c = this.claims(); return !!(c && c.roles && c.roles.includes(r)); },
    /* สิทธิ์ Overhaul (Diagram/08-login-และสิทธิ์/02-overhaul-สิทธิ์ตาม-role.md):
       แก้ไข = admin-super ที่อยู่ กบค. · ดู = admin-region ในเขต / admin-department เจ้าของรถ · ตอบนัด = admin-department เจ้าของรถ */
    async overhaul() { const c = this.claims(); if (!c) return null; const p = (await load()).personas.find(x => x.access_token_claims.emp_id === c.emp_id); return p ? p.overhaul : null; },
  };
})();
