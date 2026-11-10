#!/usr/bin/env node
/* สร้าง personas.json — ข้อมูลจำลองการ login ของ VMS Plus (30 ต.ค. 2569)
   รูป payload ยึดของจริงที่จับจาก vmsplus-dev.pea.co.th (บัญชีทดสอบของ dev) — ฉบับจริงตัดข้อมูลส่วนตัวแล้วอยู่นอกรีโป ~/PEA/Maintain-D/vmsplus-login/
   ลำดับจริง: POST login/authen-keycloak → { accessToken, refreshToken, idTokenHint } (JWT HS256) เก็บใน localStorage → GET /api/login/profile
   ตัวตน หน่วยงาน รหัส dept_sap / business_area ทั้งหมดเป็นค่าจำลอง (รูปแบบเดียวกับของจริง) · ลายเซ็น JWT = "mock" ใช้ตรวจจริงไม่ได้
   รัน: node design-mock/auth/build-personas.js  (เขียนทับ personas.json ข้างไฟล์นี้) */
const fs = require('fs'), path = require('path');

const IAT = Date.UTC(2026, 9, 30, 1, 0, 0) / 1000;   // 30 ต.ค. 2569 08:00 น.
const ACCESS_TTL = 36000, REFRESH_TTL = 5184000;      // ตามของจริง: access 10 ชม. · refresh 60 วัน
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims, head) => b64(head || { alg: 'HS256', typ: 'JWT' }) + '.' + b64(claims) + '.mock';   // token ของ VMS Plus = HS256 · idToken ของ SSO = RS256 + kid

/* สิทธิ์ Overhaul ตามชีต CF แท็บ OH-Permission (PO ✅ CF) + เจ้าของงาน 30 ต.ค. 2569 "กบค แก้ไขได้หน่วยงานเดียว หน่วยงานเจ้าของรถ / กรย เห็นแต่แก้ไขไม่ได้"
   ไม่ได้อยู่ใน payload จริง — ระบบคำนวณจาก roles[] + dept_sap / business_area (ดู Diagram/08-login-และสิทธิ์/02-overhaul-สิทธิ์ตาม-role.md) */
const PEOPLE = [
  { id: 'kbk', label: 'กบค. — แก้ไขได้ทุกคัน', emp_id: '510231', first_name: 'นายวิชัย', last_name: 'ทองดี', position: 'วศ.8',
    dept_sap: '4120', dept_sap_short: 'ผบย. กบค. ฝยพ. สายงาน วศ', dept_sap_full: 'แผนกบำรุงรักษายานพาหนะ/กบค./ฝ่ายยานพาหนะ (จำลอง)', bureau_dept_sap: '412',
    business_area: 'Z000', cost_center: 'Z412010000', level_code: '08', roles: ['admin-super', 'vehicle-user'],
    overhaul: { scope: 'ทั้งประเทศ', edit: true, reply_appointment: false, note: 'สร้าง/แก้ไข/ลบ แผน PO นัดหมาย ทุกขั้นของงานรายคัน' } },
  { id: 'kry', label: 'กรย. กฟต.3 — ดูอย่างเดียว ในเขต', emp_id: '520417', first_name: 'นางสาวพิมพ์ชนก', last_name: 'ศรีสุข', position: 'พชง.7',
    dept_sap: '8310', dept_sap_short: 'ผรย. กรย. กฟต.3', dept_sap_full: 'แผนกรถยนต์/กรย./การไฟฟ้าส่วนภูมิภาค เขต 3 ภาคใต้ (จำลอง)', bureau_dept_sap: '831',
    business_area: 'L000', cost_center: 'L831010000', level_code: '07', roles: ['admin-region', 'vehicle-user'],
    overhaul: { scope: 'รถในเขต (business_area ขึ้นต้นด้วย L)', edit: false, reply_appointment: false, note: 'เปิดแผนได้ PO และรถกรองเหลือเฉพาะเขตตัวเอง' } },
  { id: 'owner', label: 'หน่วยงานเจ้าของรถ กฟฟ.สงขลา — ดู + ตอบนัด', emp_id: '530862', first_name: 'นางวรรณา', last_name: 'แก้วมณี', position: 'หผ.8',
    dept_sap: '8352', dept_sap_short: 'ผบร. กฟฟ.สงขลา กฟต.3', dept_sap_full: 'แผนกบริการ/การไฟฟ้าส่วนภูมิภาคจังหวัดสงขลา/กฟต.3 (จำลอง)', bureau_dept_sap: '835',
    business_area: 'L052', cost_center: 'L835200000', level_code: '08', roles: ['admin-department', 'approval-department', 'vehicle-user'],
    overhaul: { scope: 'รถของหน่วยงานตัวเอง (dept_sap เจ้าของรถ)', edit: false, reply_appointment: true, note: 'กดได้แค่ ตอบรับ / ปฏิเสธนัด (นัดเข้าอู่ · นัดรับรถ) · รถคันอื่นใน PO เดียวกันไม่เห็น' } },
  { id: 'none', label: 'ผู้ใช้รถทั่วไป — ไม่มีสิทธิ์ Overhaul', emp_id: '540015', first_name: 'นายธนา', last_name: 'มีสุข', position: 'พชง.5',
    dept_sap: '8361', dept_sap_short: 'ผปบ. กฟส.หาดใหญ่ กฟต.3', dept_sap_full: 'แผนกปฏิบัติการและบำรุงรักษา/กฟส.หาดใหญ่/กฟต.3 (จำลอง)', bureau_dept_sap: '836',
    business_area: 'L053', cost_center: 'L836100000', level_code: '05', roles: ['vehicle-user'],
    overhaul: { scope: 'ไม่มี', edit: false, reply_appointment: false, note: 'ไม่เห็นเมนู "จัดการงาน Overhaul" · เปิดลิงก์ตรงได้หน้า ไม่มีสิทธิ์' } },
];

const build = (p) => {
  const full = p.first_name + ' ' + p.last_name;
  const common = { emp_id: p.emp_id, first_name: p.first_name, last_name: p.last_name, full_name: full, position: p.position,
    dept_sap: p.dept_sap, dept_sap_short: p.dept_sap_short, dept_sap_full: p.dept_sap_full, bureau_dept_sap: p.bureau_dept_sap,
    mobile_number: '-', internal_number: '', business_area: p.business_area, image_url: '' };
  const access = Object.assign({ emp_id: p.emp_id, token_type: 'access' }, common, { roles: p.roles, is_employee: true, level_code: p.level_code,
    login_by: 'keycloak', iss: 'vms-plus', aud: ['vms-plus-client'], exp: IAT + ACCESS_TTL, iat: IAT, jti: 'mock-access-' + p.id });   // ลำดับ key ตามของจริง
  const refresh = { emp_id: p.emp_id, token_type: 'refresh', first_name: '', last_name: '', full_name: full, position: '', dept_sap: '', dept_sap_short: '',
    dept_sap_full: '', bureau_dept_sap: '', mobile_number: '', internal_number: '', business_area: '', image_url: '', roles: null, is_employee: false,
    level_code: '', login_by: 'keycloak', iss: 'vms-plus', aud: ['vms-plus-client'], exp: IAT + REFRESH_TTL, iat: IAT, jti: 'mock-refresh-' + p.id };
  const id = { exp: IAT + 300, iat: IAT, auth_time: IAT, jti: 'mock-id-' + p.id, iss: 'https://sso2.pea.co.th/realms/pea-users', aud: 'pea-VMS-Plus',
    sub: 'f:mock:' + p.emp_id, typ: 'ID', azp: 'pea-VMS-Plus', sid: 'mock-sid-' + p.id, at_hash: 'mock', acr: '1',
    hr_dept_sap_full: p.dept_sap_full, hr_cost_center: p.cost_center, email_verified: true, hr_department: p.dept_sap_short, hr_dept_change_code: 'mock',
    hr_dept_sap: p.dept_sap, hr_lastname: p.last_name, hr_stell_text_full: p.position, hr_position: p.position, preferred_username: p.emp_id,
    hr_fullname_th: full, hr_employee_id: p.emp_id, given_name: p.first_name, hr_mobilephone: 'ไม่ยินยอมเปิดเผยข้อมูล', hr_fullname_en: 'Mock ' + p.id,
    name: 'Mock ' + p.id, hr_posi_status_desc: 'พนักงานปกติ', identity_no: '0000000000000', hr_firstname: p.first_name, hr_posi_code: 'mock',
    hr_business_area: p.business_area, family_name: p.id, email: p.id + '@mock.invalid' };
  const login_response = { accessToken: jwt(access), refreshToken: jwt(refresh), idTokenHint: jwt(id, { alg: 'RS256', typ: 'JWT', kid: 'mock' }) };
  const profile = Object.assign({}, common, { posi_text: p.position, license_status_code: '', license_status: '', trn_request_annual_driver_uid: '',
    annual_yyyy: 2569, annual_licenses: [], roles: p.roles, login_by: 'keycloak', is_employee: true, level_code: p.level_code, is_level_m5: '0',
    id_token_hint: login_response.idTokenHint });
  delete profile.position;
  return { id: p.id, label: p.label, overhaul: p.overhaul, login_response, access_token_claims: access, profile };
};

const out = {
  _note: 'ข้อมูลจำลอง login VMS Plus — รูปเดียวกับ payload จริง (30 ต.ค. 2569) ตัวตน/หน่วยงาน/รหัสทั้งหมดเป็นค่าจำลอง · JWT ลายเซ็น "mock" · สร้างด้วย build-personas.js ห้ามแก้มือ',
  flow: ['POST /api/login/request-keycloak {redirect_uri}', 'SSO sso2.pea.co.th → /callback_code_token?code=…', 'POST /api/login/authen-keycloak {code, redirect_uri} → login_response',
    'localStorage: accessToken · refreshToken · idTokenHint', 'GET /api/login/profile (Authorization: Bearer accessToken · x-apikey) → profile'],
  personas: PEOPLE.map(build),
};
fs.writeFileSync(path.join(__dirname, 'personas.json'), JSON.stringify(out, null, 2) + '\n');
console.log('personas.json: ' + out.personas.map(p => p.id).join(', '));
