// ============================================================================
// trip-plan.js — โมดูล "ทำแผนการเดินทาง" (window.TRIP)
// ============================================================================
// ยกออกมาจาก app.js 25 ส.ค. 2569 ตามที่เจ้าของงานสั่ง — เดิมโค้ดก้อนนี้ฝังอยู่ใน
// wizard ของ stepper 6 เฟส แก้ทีต้องเปิด app.js ทั้งไฟล์ และเอาไปใช้ที่อื่นไม่ได้
//
// กติกาของโมดูลนี้: **ไม่รู้จัก stepper / เฟส / router ของ host เลย**
// อยากให้ re-render หรือเปลี่ยนสถานะปุ่ม → เรียก callback ที่ host ส่งเข้ามาทาง bindStep1()
// ⇒ เสียบเข้าหน้าไหนก็ได้ ตอนนี้มี 2 ที่: index.html (เฟส 2 ของ stepper) · trip-plan.html (หน้าเดี่ยว)
//
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้
//
// API
//   TRIP.state                   → { q, expanded, step } q = ไตรมาสที่เพิ่งเปิดดู/แก้ล่าสุด · expanded =
//                                  { Q1..Q4: bool } ไตรมาสไหนกางอยู่บ้าง · step = { Q1..Q4: 1|2 } แต่ละไตรมาส
//                                  กำลังดูขั้น "แผนเดินทาง"(1) หรือ "ทวน+ยืนยัน"(2) อยู่ (โมดูลถือเองทั้งหมด)
//   TRIP.blockers(plan)          → string[] เหตุผลที่ยังไปต่อไม่ได้ (ว่าง = ผ่าน)
//   TRIP.sendable(trip)          → ใบนี้กดส่งได้หรือยัง
//
//   ทางเข้าหลัก — การ์ดไตรมาสเดียว รวม "ทำแผนเดินทาง" + "ทวน+ยืนยัน" ไว้ในตัวเอง (28 ส.ค. 2569 รอบ 3):
//   TRIP.renderTravel(plan, opts) → html · การ์ดไตรมาสทั้ง 4 พับ/กางอิสระ แต่ละใบมี mini-stepper 2 ขั้นของ
//                                  ตัวเอง (แผนเดินทาง / ทวน+ยืนยัน) สลับได้อิสระไม่ผูกกับไตรมาสอื่น
//                                  opts.showConfirm — true = วาดปุ่ม "ยืนยัน<ไตรมาส>" ในขั้นทวน+ยืนยันของ
//                                  ไตรมาสที่พร้อมแล้ว (quarterTravelReady) — ไม่ส่ง/false = ไม่วาด
//   TRIP.bindTravel(plan, opts)  → ผูก event ทั้งหมด · opts = { onChange, onConfirm } — onConfirm(q) เรียก
//                                  หลังกดยืนยันไตรมาส q สำเร็จ (host ตัดสินใจว่าจะพาไปไหนต่อ — เช่น เปิดหน้า
//                                  ไตรมาสนั้น) · ยืนยันครบทุกไตรมาสแล้ว plan.travelConfirmed เป็น true ให้เอง
//   ใช้ที่ index.html เท่านั้น (host ที่ไม่มี stepper 2 ขั้นระดับหน้าของ shell ตัวเองแล้ว)
//
//   ทางเข้าเดิม — stepper 2 ขั้นระดับหน้า คุมทุกไตรมาสพร้อมกัน (ยังใช้ที่ trip-plan.html เท่านั้น):
//   TRIP.renderStep1(plan)       → html · ขั้น 1 ทำแผนเดินทาง (รายการพับ/กางทั้ง 4 ไตรมาส)
//   TRIP.bindStep1(plan, opts)   → ผูก event · opts = { onChange, onValidity }
//   TRIP.renderStep2(plan, opts) → html · ขั้น 2 ทวน + ยืนยัน (รายการพับ/กางทั้ง 4 ไตรมาส) · opts.showConfirm
//                                  เหมือน renderTravel ด้านบน (trip-plan.html ไม่ส่ง — มีปุ่มยืนยันทั้งแผนเอง)
//   TRIP.bindStep2(plan, opts)   → ผูก event พับ/กางไตรมาส + ปุ่มยืนยันรายไตรมาส (ถ้ามี) · opts = { onChange,
//                                  onValidity, onConfirm(q) }
//   TRIP.confirm(plan)           → ยืนยันแผนเดินทางทั้งก้อนทีเดียว (host re-render เอง) — ใช้เมื่อ host มี
//                                  ปุ่มยืนยันทั้งแผนของ shell เอง (ไม่ใช่ยืนยันทีละไตรมาส)
//   TRIP.renderConfirmed(plan, opts) / TRIP.bindConfirmed(opts)  → หน้าสรุปหลังยืนยัน
//                                  opts.onNextPhase — ไม่ส่งมา = ไม่มีปุ่ม "ไปเฟสถัดไป"
// ============================================================================
(function () {
  'use strict';

  // ไตรมาสที่กำลังดู/แก้ล่าสุด + ไตรมาสไหนกางอยู่บ้าง — เดิมเป็นแท็บสลับทีละไตรมาส (state.travelQ ของ
  // app.js) เปลี่ยนเป็นรายการพับ/กางทั้ง 4 ไตรมาส (28 ส.ค. 2569 เจ้าของงานสั่ง) — expanded ถือแยกจาก q
  // เพราะตอนนี้กางได้พร้อมกันหลายไตรมาส ไม่ใช่เลือกได้ทีละอันเหมือนแท็บเดิม
  const S = { q: 'Q1', expanded: {} };

  // ป้ายสถานะของใบเดินทาง — ย้ายมาจาก app.js 25 ส.ค. 2569 พร้อมกับตัวโมดูล
  const TRIP_STATUS_BADGE = {
    draft:    { cls: 'b-low',   text: 'ยังไม่ส่ง' },
    waiting:  { cls: 'b-low',   text: 'รอตอบรับ' },
    rejected: { cls: 'b-brand', text: 'ถูกปฏิเสธ' },
    accepted: { cls: 'b-ok',    text: 'ตอบรับแล้ว' },
  };

  // แผนเดินทางสายซ่อมถือเป็น "array ตัวเป็นๆ ตัวเดียว" ทั้งโมดูล แล้ว mutate ที่เดิม
  // ⚠️ ห้ามโหลดสำเนาใหม่ทุกรอบ render — เคยทำแล้วเจอบั๊ก: handler ของ render รอบก่อน
  // ยังถือสำเนาเก่าอยู่ พอมันเซฟ จะเขียนทับค่าที่เพิ่งกรอกไปในรอบใหม่ (crewVehicle หายเงียบๆ)
  // ฝั่งบำรุงรักษาไม่เจอปัญหานี้เพราะ host ส่ง object `plan` ตัวเป็นๆ เข้ามาให้อยู่แล้ว
  let REPAIR_TRIPS = null;
  function repairTrips() {
    if (!REPAIR_TRIPS) REPAIR_TRIPS = MYD.loadRepairTrips();
    return REPAIR_TRIPS;
  }

  // callback ที่ host ส่งมา — ตั้งต้นเป็น no-op เผื่อเรียกก่อน bindStep1()/bindStep2()
  // onConfirm(q): เรียกหลังกดปุ่ม "ยืนยัน<ไตรมาส>" ในขั้นทวน+ยืนยัน สำเร็จแล้ว (host ตัดสินว่าพาไปไหนต่อ)
  const HOST = { onChange() {}, onValidity() {}, onConfirm() {} };

  // เหตุผลที่ขั้นแผนเดินทางยังไปต่อไม่ได้ — คืนเป็นรายการข้อความ (ว่าง = ผ่าน)
  // ต้องสะท้อน MYD.allQuartersTravelReady() ให้ตรงเป๊ะ ไม่งั้นจะบอกผู้ใช้ผิด — กล่องนี้โชว์เฉพาะตอน
  // ปุ่ม "ถัดไป" ยัง disabled คือยังมีไตรมาสที่ไม่พร้อมอยู่ จึงแจกแจงทีละไตรมาสว่าติดอะไร
  const TRIP_STATUS_TEXT = { draft: 'ยังไม่ได้ส่ง', waiting: 'รอหน่วยงานตอบรับ', rejected: 'ถูกปฏิเสธ — แก้แล้วส่งใหม่' };
  function travelBlockers(plan) {
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    if (!trips.length) return ['ยังไม่มีใบเดินทางสักใบ — กด "สร้างแผนเดินทางใหม่" ก่อน'];

    const out = [];
    MYD.QUARTER_KEYS.forEach(q => {
      if (MYD.quarterTravelReady(plan, master, q)) return;   // ไตรมาสนี้พร้อมแล้ว ไม่ต้องแจ้ง
      const ids = (plan.byQuarter[q] || []).filter(id => MYD.isVehicleIn(plan, id));
      if (!ids.length) return;   // ไม่มีรถอยู่ในไตรมาสนี้ (พักไว้/ย้ายออกหมด) ไม่ต้องแจ้ง

      const unassigned = MYD.unassignedVehicleIdsInQuarter(plan, q);
      const qTrips = trips.filter(t => (t.vehicleIds || []).some(id => ids.includes(id)));
      const parts = [];
      if (unassigned.length) parts.push(`รถ <b>${unassigned.length}</b> คันยังไม่อยู่ในใบเดินทางไหนเลย`);
      if (!qTrips.length && !unassigned.length) parts.push('ยังไม่มีใบเดินทางของไตรมาสนี้');
      qTrips.filter(t => MYD.tripStatus(t, master) !== 'accepted').forEach(t =>
        parts.push(`ใบ "${esc(t.name || 'แผนเดินทาง')}" ${esc(TRIP_STATUS_TEXT[MYD.tripStatus(t, master)] || '')}`));
      if (parts.length) out.push(`<b>${esc(MYD.quarterLabel(q))}</b>: ${parts.join(' · ')}`);
    });
    return out;
  }

  function tripVehicles(trip, master) {
    const byId = new Map(master.vehicles.map(v => [v.id, v]));
    return (trip.vehicleIds || []).map(id => byId.get(id)).filter(Boolean);
  }

  // ไตรมาสเจ้าของใบเดินทาง — ใบใหม่ถูก tag ตอนสร้าง (trip.quarter) ตามไตรมาสที่กำลังดูอยู่
  // (แยกทำทีละไตรมาสจริง เจ้าของงานสั่ง 26 ส.ค. 2569 — หน้านี้เคยโชว์ทุกใบรวมกันแม้สลับแท็บ)
  // ใบเก่าก่อนมีฟีลด์นี้ → เดาจากไตรมาสของรถคันแรกในใบแทน
  function tripQuarterOf(trip, plan) {
    if (trip.quarter && MYD.QUARTER_KEYS.includes(trip.quarter)) return trip.quarter;
    const firstId = (trip.vehicleIds || [])[0];
    if (firstId) {
      const b = MYD.bucketOf(plan, firstId);
      if (MYD.QUARTER_KEYS.includes(b)) return b;
    }
    return null;
  }

  // 1 แผนบำรุงรักษามีแผนเดินทางได้หลายใบ — กบค. เลือกเองว่ารถคันไหนเข้าใบไหน
  // (เจ้าของงานเคาะ 10 ส.ค. 2569: "การสร้างจะอิสระ หมายถึงเลือกรถได้ เลือกแผน")
  // ข้อความใต้ช่องค่าเบี้ยเลี้ยง — บอกที่มาของตัวเลขให้ตรวจสอบได้
  function perDiemNote(trip) {
    const perDay = MYD.tripPerDiemPerDay(trip), days = MYD.tripDays(trip);
    if (!days) return 'ยังไม่ได้เลือกช่วงวัน — ระบุจากวันที่/ถึงวันที่ก่อน';
    return `${perDay.toLocaleString('th-TH')} บาท/วัน (รวมทุกคน) × ${days} วัน`;
  }

  // เกณฑ์ "ส่งใบเดินทางได้" — ที่เดียวจบ เพราะใช้ทั้งตอน render และตอนอัปเดตสดระหว่างพิมพ์
  // (เคยเขียนแยกกันแล้วหลุด: ตอนพิมพ์เช็คแค่ tripReadyToSend ปุ่มเลยเปิดทั้งที่ยังไม่ได้ระบุพนักงาน)
  function tripSendable(trip) {
    return MYD.tripReadyToSend(trip) && MYD.tripDoerReady(trip) && !MYD.tripJobsIncomplete(trip).length;
  }

  // กล่องแผนเดินทางหนึ่งใบ — แยกออกมาเป็นฟังก์ชันเดี่ยวเพราะตอนนี้ต้องเรียกซ้ำได้ทั้ง 4 ไตรมาส
  // (เดิมเป็น .map() ฝังอยู่ใน renderProcStep2 ตัวเดียว เพราะแสดงแค่ไตรมาสที่เลือกจากแท็บ)
  function renderTripBox(trip, master, unassignedOpts) {
      MYD.ensureTripPerDiem(trip);   // ใบเก่าที่มีแต่ยอดรวม → เกลี่ยลงรายคน + sync perDiem ให้ตรงผลรวมเสมอ
      const st = MYD.tripStatus(trip, master);
      const b = TRIP_STATUS_BADGE[st];
      const sent = !!trip.sentAt;
      const locked = sent && st !== 'rejected';   // ส่งแล้วแก้ไม่ได้ จนกว่าจะถูกปฏิเสธ
      const dis = locked ? 'disabled' : '';
      const vs = tripVehicles(trip, master);
      const vendor = MYD.tripVendor(trip);

      const rows = vs.map(v => {
        const jobs = MYD.tripJobsOf(trip, v.id);
        const noJob = !jobs.change && !jobs.inspect;
        const placeSet = (trip.places || {})[v.id];
        return `<tr>
          <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
          <td>${esc(v.ownerDept)}<div class="cell-sub">${v.ownerLevel === 'region' ? 'รถของเขต' : esc(v.province)}</div></td>
          <td>${locked
                ? esc(MYD.tripJobsText(trip, v.id))
                : `<div class="chips pick">${MYD.TRIP_JOBS.map(j => `
                    <span class="chip ${jobs[j.id] ? 'sel' : ''}" data-job-trip="${esc(trip.id)}"
                      data-job-veh="${esc(v.id)}" data-job="${esc(j.id)}">${esc(j.label)}</span>`).join('')}</div>
                   ${noJob ? '<div class="cell-sub">ต้องเลือกอย่างน้อย 1 งาน</div>' : ''}`}</td>
          <td><div class="in noic"><input type="text" value="${esc(placeSet || '')}" ${dis}
                placeholder="${esc(MYD.defaultPlaceOf(v))}"
                data-place-trip="${esc(trip.id)}" data-place-veh="${esc(v.id)}"></div>
              <div class="cell-sub">${placeSet ? 'แก้จากค่าตั้งต้น' : 'ค่าตั้งต้น: ' + esc(MYD.defaultPlaceOf(v))}</div></td>
          <td class="num">${locked ? '' : `<button class="btn btn-g btn-sm" data-trip-drop="${esc(trip.id)}" data-veh="${esc(v.id)}">เอาออกจากใบนี้</button>`}</td>
        </tr>`;
      }).join('');

      const replyRows = MYD.tripDepts(trip, master).map(d => {
        const r = MYD.tripReply(trip, d);
        const rb = r.status === 'accepted' ? 'b-ok' : r.status === 'rejected' ? 'b-brand' : 'b-low';
        const rt = r.status === 'accepted' ? 'ตอบรับ' : r.status === 'rejected' ? 'ปฏิเสธ' : 'รอตอบ';
        return `<tr><td>${esc(d)}</td>
          <td><span class="badge ${rb}">${rt}</span></td>
          <td>${esc(r.reason || '—')}</td>
          <td>${esc(r.at || '—')}</td></tr>`;
      }).join('');

      return `
        <div class="rzone">
          <div class="rzone-head">
            <span class="ms rzone-caret">event</span>
            <b>${esc(trip.name || 'แผนเดินทาง')}</b>
            <span class="rzone-count">${vs.length} คัน · ${MYD.tripDepts(trip, master).length} หน่วยงาน · ${MYD.tripCost(trip).toLocaleString('th-TH')} บาท</span>
            <span class="badge ${trip.mode === 'vendor' ? 'b-info' : 'b-neutral'}">${trip.mode === 'vendor' ? (vendor ? esc(vendor.name) : 'จ้าง — ยังไม่เลือกผู้รับจ้าง') : 'กบค. ตรวจเอง'}</span>
            <span class="badge ${b.cls}">${b.text}</span>
          </div>
          <div class="rzone-body">
            <div class="fgrid">
              <div class="f sp2"><label>ชื่อแผน</label>
                <div class="in"><span class="ms">label</span>
                  <input type="text" value="${esc(trip.name || '')}" ${dis}
                    placeholder="เช่น ชัยนาท รอบ 1" data-trip="${esc(trip.id)}" data-field="name"></div></div>
              <div class="f sp2"><label>สถานที่บำรุงรักษา</label>
                <div class="in"><span class="ms">place</span>
                  <input type="text" value="${esc(trip.location || '')}" ${dis}
                    placeholder="เช่น จุดรวมงาน กฟจ. ชัยนาท" data-trip="${esc(trip.id)}" data-field="location"></div></div>
              <div class="f sp2"><label>ช่วงที่เสนอ — จากวันที่</label>
                <div class="in noic"><input type="date" value="${esc(trip.windowFrom || '')}" ${dis}
                  data-trip="${esc(trip.id)}" data-field="windowFrom"></div></div>
              <div class="f sp2"><label>ถึงวันที่</label>
                <div class="in noic"><input type="date" value="${esc(trip.windowTo || '')}" ${dis}
                  data-trip="${esc(trip.id)}" data-field="windowTo"></div></div>
              <div class="f sp4"><label>ผู้ดำเนินการของใบนี้</label>
                <div class="seg">
                  <div class="sg tripMode ${trip.mode !== 'vendor' ? 'sel' : ''}" data-mode-trip="${esc(trip.id)}" data-mode="self">
                    กบค. ตรวจเอง<div class="sg-sub">ระบุชื่อพนักงานที่ออกไปซ่อม</div></div>
                  <div class="sg tripMode ${trip.mode === 'vendor' ? 'sel' : ''}" data-mode-trip="${esc(trip.id)}" data-mode="vendor">
                    จ้างผู้รับจ้าง<div class="sg-sub">assign ใบนี้ให้ผู้รับจ้างไปทำ</div></div>
                </div></div>
              ${trip.mode === 'vendor' ? `
              <div class="f sp2"><label>ผู้รับจ้าง</label>
                <div class="in noic"><select data-vendor-trip="${esc(trip.id)}" ${dis}>
                  <option value="">— เลือกผู้รับจ้าง —</option>
                  ${MYD.vendorsForTrip(trip, master).map(vd => `
                    <option value="${esc(vd.id)}" ${trip.vendorId === vd.id ? 'selected' : ''}>${esc(vd.name)}</option>`).join('')}
                </select></div>
                ${vendor ? `<div class="cell-sub">ผู้ติดต่อ ${esc(vendor.contact)} · ${esc(vendor.phone)} · เลขผู้เสียภาษี ${esc(vendor.taxId)}</div>` : ''}</div>
              <div class="f sp2"><label>ค่าจ้างเหมา (บาท)</label>
                <div class="in noic"><input type="number" min="0" value="${esc(trip.hireCost ?? 0)}" ${dis}
                  data-trip="${esc(trip.id)}" data-field="hireCost"></div></div>
              ` : ''}
            </div>

            ${trip.mode === 'vendor' ? '' : `
            <div class="sect">พนักงาน กบค. ที่ออกไปซ่อม</div>
            <div class="sub">ปกติ 2-3 คนต่อใบ — ใส่ชื่อไว้เพื่อให้หน่วยงานเจ้าของรถรู้ว่าใครจะไป
              · ค่าเบี้ยเลี้ยงกรอกเป็น<b>อัตราต่อวัน</b>รายคน ระบบคูณจำนวนวันของช่วงที่เสนอแล้วรวมให้ในช่องด้านล่าง</div>
            <div class="fgrid">
              ${(trip.staff || ['']).map((name, i) => `
                <div class="f sp3"><label>คนที่ ${i + 1}</label>
                  <div class="in"><span class="ms">engineering</span>
                    <input type="text" value="${esc(name || '')}" ${dis} placeholder="ชื่อ-สกุล"
                      data-staff-trip="${esc(trip.id)}" data-staff-i="${i}"></div></div>
                <div class="f"><label>ค่าเบี้ยเลี้ยง/วัน (บาท)</label>
                  <div class="in noic"><input type="number" min="0" value="${esc((trip.staffPerDiem || [])[i] ?? 0)}" ${dis}
                    data-staffpd-trip="${esc(trip.id)}" data-staffpd-i="${i}"></div></div>`).join('')}
            </div>
            ${locked ? '' : `<div class="actions" style="justify-content:flex-start;margin-top:-6px">
              <button class="btn btn-t btn-sm" data-staff-add="${esc(trip.id)}"><span class="ms">add</span> เพิ่มคน</button>
              ${(trip.staff || []).length > 1 ? `<button class="btn btn-t btn-sm" data-staff-del="${esc(trip.id)}"><span class="ms">remove</span> ลดคน</button>` : ''}
            </div>`}

            <div class="fgrid">
              <div class="f ro"><label>ค่าเบี้ยเลี้ยง (บาท) <small>คิดให้อัตโนมัติ</small></label>
                <div class="in noic"><input type="number" value="${esc(MYD.tripPerDiemSum(trip))}" readonly
                  data-perdiem-sum="${esc(trip.id)}"></div>
                <div class="cell-sub" data-perdiem-note="${esc(trip.id)}">${esc(perDiemNote(trip))}</div></div>
              <div class="f"><label>ค่าที่พัก (บาท)</label>
                <div class="in noic"><input type="number" min="0" value="${esc(trip.lodging ?? 0)}" ${dis}
                  data-trip="${esc(trip.id)}" data-field="lodging"></div></div>
              <div class="f"><label>ค่าเดินทาง (บาท)</label>
                <div class="in noic"><input type="number" min="0" value="${esc(trip.travel ?? 0)}" ${dis}
                  data-trip="${esc(trip.id)}" data-field="travel"></div></div>
              <div class="f"><label>รวม</label><div><b data-trip-grand="${esc(trip.id)}">${esc(MYD.tripPerDiemSum(trip) + (trip.lodging || 0) + (trip.travel || 0))} บาท</b></div></div>
            </div>
            `}

            <div class="sect">รถในแผนนี้</div>
            <div class="sub">วันนัดรายคันไม่ได้กำหนดที่นี่ — หน่วยงานเจ้าของรถเป็นคนเลือกวันเองภายในช่วงที่เสนอ ตอนตอบรับแผนนัด</div>
            ${vs.length ? `<div class="tblwrap"><table class="tbl">
              <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>งานที่จะทำ</th><th>สถานที่บำรุงรักษา</th><th></th></tr></thead>
              <tbody>${rows}</tbody></table></div>`
              : `<div class="empty">ยังไม่มีรถในแผนนี้ — เลือกจากรายการด้านล่าง</div>`}

            ${locked ? '' : `
            <div class="fgrid">
              <div class="f sp2"><label>เพิ่มรถเข้าแผนนี้ <small>เลือกจากคันที่ยังไม่ถูกจัด</small></label>
                <div class="in"><span class="ms">directions_car</span>
                  <select data-trip-add-sel="${esc(trip.id)}" ${unassignedOpts ? '' : 'disabled'}>
                    ${unassignedOpts || '<option>— จัดครบทุกคันแล้ว —</option>'}</select></div></div>
              <div class="f"><label>&nbsp;</label>
                <button class="btn btn-s" data-trip-add="${esc(trip.id)}" ${unassignedOpts ? '' : 'disabled'}>เพิ่ม</button></div>
            </div>`}

            ${sent ? `
              <div class="sect">การตอบรับรายหน่วยงาน</div>
              <div class="sub">ส่งเมื่อ ${esc(trip.sentAt)} · เอกสารส่งถึงเจ้าของรถและ กรย. (กรย. รับสำเนา ไม่ต้องกดตอบ)</div>
              <div class="tblwrap"><table class="tbl">
                <thead><tr><th>หน่วยงาน</th><th>สถานะ</th><th>เหตุผลที่ปฏิเสธ</th><th>ตอบเมื่อ</th></tr></thead>
                <tbody>${replyRows}</tbody></table></div>` : ''}

            <div class="actions">
              ${locked
                ? `<button class="btn btn-g" data-trip-del="${esc(trip.id)}" disabled>ส่งแล้ว แก้ไม่ได้</button>`
                : `<button class="btn btn-g" data-trip-del="${esc(trip.id)}">ลบแผนนี้</button>
                   <button class="btn btn-o" data-trip-send="${esc(trip.id)}" ${tripSendable(trip) ? '' : 'disabled'}>
                     <span class="ms">send</span> ${st === 'rejected' ? 'แก้แล้วส่งใหม่' : 'ส่งแผนนัดให้หน่วยงาน'}</button>`}
            </div>
          </div>
        </div>`;
  }

  // ขั้นที่ 1: ทำแผนเดินทาง — เดิมเป็นแท็บสลับไตรมาส (เห็นทีละไตรมาส) เปลี่ยนเป็นรายการพับ/กางทั้ง 4 ไตรมาส
  // พร้อมกัน (28 ส.ค. 2569 เจ้าของงานสั่ง) — ขยายดู/แก้ไขไตรมาสไหนก็ได้อิสระ ไม่ต้องสลับแท็บไปมา
  // logic ความพร้อม/เกณฑ์ปลดปุ่ม "ถัดไป" (MYD.quarterTravelReady / allQuartersTravelReady) ไม่เปลี่ยน
  // เนื้อขั้น "ทำแผนเดินทาง" ของไตรมาสหนึ่ง — แยกออกมาจาก renderProcStep2 (28 ส.ค. 2569 รอบ 3) เพื่อใช้ซ้ำได้
  // ทั้งหน้า index.html (ฝัง stepper ย่อยไว้ในการ์ดไตรมาสเอง — ดู renderTravelAccordion) และหน้า trip-plan.html
  // (ยังเป็น stepper ระดับหน้าเดิม — ดู renderProcStep2 ด้านล่าง) เนื้อ HTML เหมือนเดิมทุกตัวอักษร
  function renderTravelStep1Content(plan, master, trips, q) {
    const joiningQ = MYD.planVehicleIds(plan, q).filter(id => MYD.isVehicleIn(plan, id));
    const unassignedQ = MYD.unassignedVehicleIdsInQuarter(plan, q);
    const quarterTrips = trips.filter(t => tripQuarterOf(t, plan) === q);

    // จัดตัวเลือกเป็นกลุ่มตามจังหวัด — เห็นได้ทันทีว่ารถที่ยังไม่ถูกจัดของไตรมาสนี้กระจายอยู่จังหวัดไหนบ้าง
    const byProvince = {};
    master.vehicles.filter(v => unassignedQ.includes(v.id)).forEach(v => {
      const prov = MYD.provinceOfRegion(v.region);
      (byProvince[prov] = byProvince[prov] || []).push(v);
    });
    const unassignedOpts = Object.keys(byProvince).sort((a, b) => a.localeCompare(b, 'th')).map(prov => {
      const opts = byProvince[prov].map(v =>
        `<option value="${esc(v.id)}">${esc(v.plate)} · ${esc(v.ownerDept)} — ${esc(v.brand)}</option>`).join('');
      return `<optgroup label="${esc(prov)} (${byProvince[prov].length} คัน)">${opts}</optgroup>`;
    }).join('');

    return `
      <div class="sub">รถที่ยืนยันแล้ว <b>${joiningQ.length}</b> คัน
        — จัดเข้าใบแล้ว <b>${joiningQ.length - unassignedQ.length}</b> · ยังไม่จัด <b>${unassignedQ.length}</b></div>
      <div class="actions" style="justify-content:flex-start">
        <button class="btn btn-o" data-add-trip="${q}"><span class="ms">add</span> สร้างแผนเดินทางใหม่</button>
        ${unassignedQ.length ? `<button class="btn btn-s" data-auto-trips="${q}">
          <span class="ms">auto_awesome_motion</span> แยกอัตโนมัติตามจังหวัด</button>` : ''}
      </div>
      ${quarterTrips.length ? quarterTrips.map(t => renderTripBox(t, master, unassignedOpts)).join('')
        : `<div class="empty">ยังไม่มีแผนเดินทางของ${esc(MYD.quarterLabel(q))} — กดสร้างแผนใหม่ หรือให้ระบบแยกตามจังหวัดให้</div>`}
      ${unassignedQ.length ? `<div class="empty">ยังมีรถ ${unassignedQ.length} คันที่ยังไม่ถูกจัดเข้าแผนใด — ต้องจัดครบก่อนไปขั้นถัดไป</div>` : ''}`;
  }

  function renderProcStep2(plan) {
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    MYD.ensurePlanQuarters(plan);
    if (!MYD.QUARTER_KEYS.includes(S.q)) S.q = 'Q1';
    if (!S.expanded) S.expanded = {};
    // ไตรมาสที่เพิ่งดู/แก้ล่าสุด (S.q — ค้างมาจากตอนยังเป็นแท็บ) เริ่มต้นแบบกางไว้ก่อน ไตรมาสอื่นพับ
    if (!(S.q in S.expanded)) S.expanded[S.q] = true;

    const accepted = trips.filter(t => MYD.tripStatus(t, master) === 'accepted').length;
    const noneIds = MYD.planVehicleIds(plan, 'none');

    const qBlocks = MYD.QUARTER_KEYS.map(q => {
      const months = QUARTERS.find(x => x.q === q).months;
      const joiningQ = MYD.planVehicleIds(plan, q).filter(id => MYD.isVehicleIn(plan, id));
      const ready = MYD.quarterTravelReady(plan, master, q);
      const quarterTrips = trips.filter(t => tripQuarterOf(t, plan) === q);
      const expanded = !!S.expanded[q];
      const body = !expanded ? '' : renderTravelStep1Content(plan, master, trips, q);

      return `
        <div class="rzone" data-q="${q}">
          <div class="rzone-head" data-toggle-q="${q}">
            <span class="ms rzone-caret">${expanded ? 'expand_more' : 'chevron_right'}</span>
            <b>${esc(MYD.quarterLabel(q))}</b>
            <span class="rzone-count">${esc(months)} · ${joiningQ.length} คัน · แผนเดินทาง ${quarterTrips.length} ใบ</span>
            <span class="badge ${ready ? 'b-ok' : 'b-neutral'}">${ready ? 'พร้อมแล้ว' : 'ยังไม่ครบ'}</span>
          </div>
          ${expanded ? `<div class="rzone-body">${body}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="sect">ขั้นที่ 1: ทำแผนเดินทาง</div>
      ${noneIds.length ? `<div class="note note-info"><span class="ms">inbox</span>
        <div>มีรถ <b>${noneIds.length}</b> คันถูกพักไว้แบบ <b>ยังไม่ระบุไตรมาส</b> — ยังอยู่ในแผน
        แต่จะไม่โผล่ในไตรมาสไหนจนกว่าจะย้ายกลับเข้าไตรมาส</div></div>` : ''}
      <div class="sub"><b>เกณฑ์ปลดปุ่ม "ถัดไป"</b>: ต้องพร้อมครบ <b>ทั้ง 4 ไตรมาส</b> (จัดรถเข้าใบครบทุกคัน + ทุกใบของแต่ละไตรมาสตอบรับแล้ว) — ดูป้ายที่แต่ละไตรมาสด้านล่าง</div>
      <div class="sub">แผนเดินทางทั้งหมด <b>${trips.length}</b> ใบ · ตอบรับครบแล้ว <b>${accepted}</b> ใบ
        · รถที่ยังไม่อยู่ในใบไหนเลย <b>${MYD.unassignedVehicleIds(plan).length}</b> คัน
        <small>(รถที่พักไว้แบบยังไม่ระบุไตรมาสไม่นับ)</small></div>
      <div class="sub">แผนหนึ่งมีได้หลายใบ — จะแยกตามจังหวัด หรือจังหวัดละหลายใบก็ได้ · แต่ละใบเสนอเป็น<b>ช่วงเวลา</b>
        แล้วหน่วยงานเจ้าของรถเลือกวันนัดของรถแต่ละคันภายในช่วงนั้นเอง</div>
      <div class="sub">กดที่แต่ละไตรมาสด้านล่างเพื่อขยายดู/แก้ไขแผนเดินทาง — ปิดได้เมื่อทำเสร็จแล้ว</div>
      <div class="stack">${qBlocks}</div>`;
  }

  function bindProcStep2(plan) {
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    const find = id => trips.find(t => t.id === id);
    const rerender = () => { MYD.savePlan(plan); HOST.onChange(); };

    // สลับ ตรวจเอง / จ้างผู้รับจ้าง — รายใบเดินทาง (เจ้าของงานเคาะ 17 ส.ค. 2569)
    document.querySelectorAll('.tripMode').forEach(sg => {
      sg.addEventListener('click', () => {
        const t = find(sg.dataset.modeTrip);
        if (!t || (t.sentAt && MYD.tripStatus(t, master) !== 'rejected')) return;
        t.mode = sg.dataset.mode;
        if (t.mode !== 'vendor') t.vendorId = null;
        rerender();
      });
    });

    document.querySelectorAll('[data-vendor-trip]').forEach(sel => {
      sel.addEventListener('change', e => {
        const t = find(sel.dataset.vendorTrip);
        if (!t) return;
        t.vendorId = e.target.value || null;
        const vd = MYD.vendorById(t.vendorId);
        if (vd) toast('assign ใบนี้ให้ ' + vd.name + ' แล้ว');
        rerender();
      });
    });

    // ปุ่ม "ส่งแผนนัด" ของใบนั้น — ต้องใช้เกณฑ์เดียวกับตอน render (tripSendable)
    // ไม่งั้นปุ่มจะเพี้ยนระหว่างพิมพ์: เคยเปิดทั้งที่ยังไม่ระบุพนักงาน และเคยไม่ยอมเปิดหลังพิมพ์ชื่อพนักงาน
    const syncSendBtn = t => {
      const btn = document.querySelector(`[data-trip-send="${t.id}"]`);
      if (btn) btn.disabled = !tripSendable(t);
    };

    // ชื่อพนักงาน กบค. — บันทึกทันทีแต่ไม่ re-render (ไม่งั้นโฟกัสหลุดระหว่างพิมพ์)
    document.querySelectorAll('[data-staff-trip]').forEach(el => {
      el.addEventListener('input', e => {
        const t = find(el.dataset.staffTrip);
        if (!t) return;
        t.staff = t.staff || [];
        t.staff[Number(el.dataset.staffI)] = e.target.value;
        MYD.savePlan(plan);
        syncSendBtn(t);   // มีชื่อพนักงานแล้ว = ผู้ดำเนินการครบ → ปุ่มส่งต้องเปิดทันที
      });
    });
    // อัปเดตยอดเงินของใบสด ๆ โดยไม่ re-render (กันโฟกัสหลุดตอนพิมพ์)
    // ใช้ทั้งตอนแก้เบี้ยเลี้ยงรายคน และตอนแก้ช่วงวัน/ที่พัก/เดินทาง เพราะทุกตัวมีผลกับยอดรวม
    const refreshTripMoney = t => {
      t.perDiem = MYD.tripPerDiemSum(t);
      const sumEl = document.querySelector(`[data-perdiem-sum="${t.id}"]`);
      if (sumEl) sumEl.value = t.perDiem;
      const noteEl = document.querySelector(`[data-perdiem-note="${t.id}"]`);
      if (noteEl) noteEl.textContent = perDiemNote(t);
      const grandEl = document.querySelector(`[data-trip-grand="${t.id}"]`);
      if (grandEl) grandEl.textContent = `${t.perDiem + (t.lodging || 0) + (t.travel || 0)} บาท`;
    };

    // ค่าเบี้ยเลี้ยงรายคน (อัตราต่อวัน)
    document.querySelectorAll('[data-staffpd-trip]').forEach(el => {
      el.addEventListener('input', e => {
        const t = find(el.dataset.staffpdTrip);
        if (!t) return;
        t.staffPerDiem = t.staffPerDiem || [];
        t.staffPerDiem[Number(el.dataset.staffpdI)] = Number(e.target.value) || 0;
        refreshTripMoney(t);
        MYD.savePlan(plan);
        HOST.onValidity();
      });
    });

    document.querySelectorAll('[data-staff-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = find(btn.dataset.staffAdd);
        if (!t) return;
        t.staff = [...(t.staff || []), ''];
        t.staffPerDiem = [...(t.staffPerDiem || []), 0];   // sync ก่อน rerender เพราะ rerender เซฟก่อนเรนเดอร์
        t.perDiem = MYD.tripPerDiemSum(t);
        rerender();
      });
    });
    document.querySelectorAll('[data-staff-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = find(btn.dataset.staffDel);
        if (!t || (t.staff || []).length <= 1) return;
        t.staff = t.staff.slice(0, -1);
        t.staffPerDiem = (t.staffPerDiem || []).slice(0, t.staff.length);
        t.perDiem = MYD.tripPerDiemSum(t);
        rerender();
      });
    });

    // งานต่อคัน — ติ๊กได้ทั้งสองอย่าง หรืออย่างเดียว
    document.querySelectorAll('[data-job]').forEach(chip => {
      chip.addEventListener('click', () => {
        const t = find(chip.dataset.jobTrip);
        if (!t) return;
        const veh = chip.dataset.jobVeh;
        const cur = MYD.tripJobsOf(t, veh);
        t.jobs = t.jobs || {};
        t.jobs[veh] = { ...cur, [chip.dataset.job]: !cur[chip.dataset.job] };
        rerender();
      });
    });

    // สถานที่บำรุงรักษารายคัน — ว่าง = กลับไปใช้ค่าตั้งต้น
    document.querySelectorAll('[data-place-trip]').forEach(el => {
      el.addEventListener('input', e => {
        const t = find(el.dataset.placeTrip);
        if (!t) return;
        t.places = t.places || {};
        t.places[el.dataset.placeVeh] = e.target.value;
        MYD.savePlan(plan);
      });
    });

    // พับ/กางไตรมาส — ไม่แตะข้อมูล แค่เปลี่ยนมุมมอง (28 ส.ค. 2569: เปลี่ยนจากแท็บสลับทีละไตรมาส
    // เป็นขยาย/พับอิสระต่อไตรมาส — จะเปิดดูพร้อมกันกี่ไตรมาสก็ได้)
    document.querySelectorAll('[data-toggle-q]').forEach(head => {
      head.addEventListener('click', () => {
        const q = head.dataset.toggleQ;
        S.expanded[q] = !S.expanded[q];
        S.q = q;   // จำไว้ว่าไตรมาสไหนที่เพิ่งกดล่าสุด (ใช้ตั้งต้น expanded ตอนเข้าขั้น 2)
        HOST.onChange();
      });
    });

    // ย้ายรถข้ามไตรมาส / พักไว้ยังไม่ระบุ / เอาออกจากแผน — ทำจากหน้าแผนเดินทางได้เลย
    // (เจ้าของงานสั่ง 17 ส.ค. 2569) · ถอดออกจากใบเดินทางที่ถืออยู่ด้วยเสมอ ไม่งั้นใบเดินทาง
    // ของไตรมาสนี้จะยังค้างรถที่ย้ายไปไตรมาสอื่นแล้ว
    // ช่องกรอกระดับใบ — บันทึกทันทีแต่ไม่ re-render (ไม่งั้นโฟกัสหลุดระหว่างพิมพ์)
    document.querySelectorAll('[data-field][data-trip]').forEach(el => {
      el.addEventListener('input', e => {
        const t = find(el.dataset.trip);
        if (!t) return;
        const f = el.dataset.field;
        t[f] = ['perDiem', 'lodging', 'travel', 'hireCost'].includes(f) ? (Number(e.target.value) || 0) : e.target.value;
        // ช่วงวันเปลี่ยน = จำนวนวันเปลี่ยน = ค่าเบี้ยเลี้ยงเปลี่ยน · ที่พัก/เดินทางมีผลกับยอดรวมทั้งใบ
        if (['windowFrom', 'windowTo', 'lodging', 'travel'].includes(f)) refreshTripMoney(t);
        MYD.savePlan(plan);
        HOST.onValidity();
        syncSendBtn(t);
      });
    });

    // ใบใหม่ tag ไตรมาสของบล็อกที่กดปุ่มมา (เดิมอิง S.q ตัวเดียวเพราะมีแค่แท็บเดียวที่เห็นอยู่
    // ตอนนี้ทุกไตรมาสมีปุ่มของตัวเอง จึงอ่านจาก data-q ของปุ่มที่กดแทน)
    const quarterTripCount = q => trips.filter(t => tripQuarterOf(t, plan) === q).length;

    document.querySelectorAll('[data-add-trip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.addTrip;
        const t = MYD.emptyTrip('trip-' + Date.now().toString(36), `แผนเดินทาง ${quarterTripCount(q) + 1}`, q);
        trips.push(t);
        rerender();
      });
    });

    // ทางลัด: หนึ่งจังหวัดหนึ่งใบ — เป็นแค่จุดตั้งต้น กบค. ยังแก้/แตกใบต่อได้
    // ขอบเขตเฉพาะรถของไตรมาสของปุ่มที่กด (เหมือนช่อง "เพิ่มรถเข้าแผนนี้" รายใบ) ไม่งั้นใบที่ได้จะมีรถ
    // ข้ามไตรมาสปนกัน แล้วไปโผล่ผิดไตรมาสตอนแสดงผล
    document.querySelectorAll('[data-auto-trips]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.autoTrips;
        const inQuarter = new Set(MYD.planVehicleIds(plan, q));
        const unassigned = MYD.unassignedVehicleIds(plan).filter(id => inQuarter.has(id));
        const byRegion = {};
        master.vehicles.filter(v => unassigned.includes(v.id))
          .forEach(v => (byRegion[v.region] = byRegion[v.region] || []).push(v.id));
        Object.keys(byRegion).sort((a, b) => a - b).forEach(r => {
          const t = MYD.emptyTrip('trip-' + Date.now().toString(36) + '-' + r, MYD.provinceOfRegion(Number(r)), q);
          t.vehicleIds = byRegion[r];
          trips.push(t);
        });
        toast(`สร้าง ${Object.keys(byRegion).length} แผนตามจังหวัดแล้ว`);
        rerender();
      });
    });

    document.querySelectorAll('[data-trip-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = find(btn.dataset.tripAdd);
        const sel = document.querySelector(`[data-trip-add-sel="${btn.dataset.tripAdd}"]`);
        if (!t || !sel || !sel.value) return;
        t.vehicleIds = [...new Set([...(t.vehicleIds || []), sel.value])];
        rerender();
      });
    });

    document.querySelectorAll('[data-trip-drop]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = find(btn.dataset.tripDrop);
        if (!t) return;
        t.vehicleIds = (t.vehicleIds || []).filter(id => id !== btn.dataset.veh);
        delete (t.dates || {})[btn.dataset.veh];
        rerender();
      });
    });

    document.querySelectorAll('[data-trip-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('ลบแผนเดินทางใบนี้? รถในใบจะกลับไปเป็นยังไม่ถูกจัด')) return;
        plan.trips = trips.filter(t => t.id !== btn.dataset.tripDel);
        rerender();
      });
    });

    document.querySelectorAll('[data-trip-send]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = find(btn.dataset.tripSend);
        if (!t || !MYD.tripReadyToSend(t)) { toast('กรอกสถานที่และช่วงวันให้ครบก่อน'); return; }
        t.sentAt = nowTh();
        t.replies = {};   // ส่งใหม่ = เริ่มนับการตอบรับใหม่ทั้งใบ
        MYD.tripDepts(t, master).forEach(d => {
          t.replies[d] = { status: 'pending', reason: '', by: '', at: '', history: [] };
        });
        toast('ส่งแผนนัดให้หน่วยงานแล้ว (สำเนาถึง กรย.)');
        rerender();
      });
    });
  }

  // เนื้อขั้น "ทวน + ยืนยัน" ของไตรมาสหนึ่ง — แยกออกมาจาก renderProcStep3 (28 ส.ค. 2569 รอบ 3) เพื่อใช้ซ้ำได้
  // ทั้งหน้า index.html (ฝัง stepper ย่อยไว้ในการ์ดไตรมาสเอง — ดู renderTravelAccordion) และหน้า trip-plan.html
  // (ยังเป็น stepper ระดับหน้าเดิม — ดู renderProcStep3 ด้านล่าง) เนื้อ HTML เหมือนเดิมทุกตัวอักษร
  //
  // opts.showConfirm — host ที่ตัดปุ่ม "ย้อนกลับ/ถัดไป" ของ shell ตัวเองออกแล้ว (index.html) ส่ง true
  // มาเพื่อให้วาดปุ่ม "ยืนยัน<ไตรมาส>" ไว้ในเนื้อ (เมื่อไตรมาสนั้นพร้อมแล้ว — quarterTravelReady) แทนปุ่มเดียว
  // ยืนยันทั้งแผน — ค่าเริ่มต้น false เพราะ host เดิม (trip-plan.html) ยังมีปุ่มยืนยันทั้งแผนของตัวเองอยู่ที่ shell
  function renderTravelStep2Content(plan, master, trips, q, opts) {
    opts = opts || {};
    const ready = MYD.quarterTravelReady(plan, master, q);
    const confirmedAt = (plan.travelConfirmedByQuarter || {})[q];
    const qTrips = trips.filter(t => tripQuarterOf(t, plan) === q);
    const tripReviewBlock = t => {
      const vs = tripVehicles(t, master);
      const sum = (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0);
      const rows = vs.map(v => `<tr>
          <td>${esc(v.plate)}</td>
          <td>${esc(v.ownerDept)}</td>
          <td>${dateTh((t.dates || {})[v.id] || '')}</td>
        </tr>`).join('');
      return `
        <div class="rzone">
          <div class="rzone-head">
            <span class="ms rzone-caret">event_available</span>
            <b>${esc(t.name || 'แผนเดินทาง')}</b>
            <span class="rzone-count">${esc(t.location || '—')} · ${dateTh(t.windowFrom)}–${dateTh(t.windowTo)}
              · ${vs.length} คัน · ${sum.toLocaleString('th-TH')} บาท</span>
            <span class="badge b-ok">ตอบรับแล้ว</span>
          </div>
          <div class="rzone-body flush"><div class="tblwrap"><table class="tbl">
            <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>วันนัด</th></tr></thead>
            <tbody>${rows}</tbody></table></div></div>
        </div>`;
    };

    return `
      ${qTrips.length ? qTrips.map(tripReviewBlock).join('') : `<div class="empty">ยังไม่มีแผนเดินทางของ${esc(MYD.quarterLabel(q))}</div>`}
      ${opts.showConfirm ? (confirmedAt
        ? `<div class="note note-ok"><span class="ms">check_circle</span>
            <div>ยืนยันแผนเดินทาง${esc(MYD.quarterLabel(q))}แล้ว เมื่อ ${esc(confirmedAt)}</div></div>`
        : ready
          ? `<div class="actions">
              <button class="btn btn-p" data-confirm-q="${q}">ยืนยัน${esc(MYD.quarterLabel(q))}</button>
            </div>`
          : '') : ''}`;
  }

  // ----- เฟส 2 (แผนเดินทาง) ขั้น 2: ทวน + ยืนยัน — หน้าระดับ "ขั้น" เดิมของ trip-plan.html เท่านั้น -----
  // (index.html ใช้ renderTravelAccordion ด้านล่างแทนแล้ว — ฝัง 2 ขั้นนี้ไว้ในการ์ดไตรมาสเอง 28 ส.ค. 2569 รอบ 3)
  // เดิมเป็นแท็บสลับทีละไตรมาส เปลี่ยนเป็นรายการพับ/กางทั้ง 4 ไตรมาสเหมือนขั้น 1 (28 ส.ค. 2569 รอบ 1)
  // ใช้ S.expanded ตัวเดียวกับขั้น 1 — ไตรมาสที่เพิ่งเปิดดู/แก้ไว้ตอนขั้น 1 จะยังกางอยู่ตอนมาถึงขั้นนี้
  function renderProcStep3(plan, opts) {
    opts = opts || {};
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    const grand = trips.reduce((n, t) => n + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);
    if (!MYD.QUARTER_KEYS.includes(S.q)) S.q = 'Q1';
    if (!S.expanded) S.expanded = {};
    if (!(S.q in S.expanded)) S.expanded[S.q] = true;

    const outRows = (plan.selectedVehicleIds || [])
      .filter(id => !MYD.isVehicleIn(plan, id))
      .map(id => {
        const v = master.vehicles.find(x => x.id === id);
        const e = MYD.vehicleConfirm(plan, id);
        return `<tr><td>${esc(v ? v.plate : id)}</td>
          <td>${esc(CF_VERDICT_LABELS[e.verdict] || 'ไม่พร้อม')}</td>
          <td>${esc(e.verdictWhy || e.reason || '—')}</td></tr>`;
      }).join('');

    const qBlocks = MYD.QUARTER_KEYS.map(qk => {
      const ready = MYD.quarterTravelReady(plan, master, qk);
      const confirmedAt = (plan.travelConfirmedByQuarter || {})[qk];
      const n = MYD.planVehicleIds(plan, qk).length;
      const qTrips = trips.filter(t => tripQuarterOf(t, plan) === qk);
      const qSum = qTrips.reduce((n2, t) => n2 + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);
      const expanded = !!S.expanded[qk];
      const badge = confirmedAt
        ? '<span class="badge b-ok">ยืนยันแล้ว</span>'
        : `<span class="badge ${ready ? 'b-ok' : 'b-neutral'}">${ready ? 'พร้อมแล้ว' : 'ยังไม่ครบ'}</span>`;
      return `
        <div class="rzone" data-q="${qk}">
          <div class="rzone-head" data-toggle-review-q="${qk}">
            <span class="ms rzone-caret">${expanded ? 'expand_more' : 'chevron_right'}</span>
            <b>${esc(MYD.quarterLabel(qk))}</b>
            <span class="rzone-count">${n} คัน · แผนเดินทาง ${qTrips.length} ใบ · ${qSum.toLocaleString('th-TH')} บาท</span>
            ${badge}
          </div>
          ${expanded ? `<div class="rzone-body">${renderTravelStep2Content(plan, master, trips, qk, opts)}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="sect">ขั้นที่ 2: ทวนแผนเดินทาง + ยืนยัน</div>
      <div class="sub">ทั้งปี — แผนเดินทาง <b>${trips.length}</b> ใบ · รวมค่าใช้จ่ายทั้งหมด <b>${grand.toLocaleString('th-TH')}</b> บาท</div>
      <div class="sub">กดที่แต่ละไตรมาสด้านล่างเพื่อขยายทวนรายละเอียด — ปิดได้เมื่อทวนเสร็จแล้ว</div>
      <div class="stack">${qBlocks}</div>
      ${outRows ? `
      <div class="sect">รถที่ไม่เข้าแผนเดินทางรอบนี้</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>คำตัดสิน กบค.</th><th>เหตุผล</th></tr></thead>
        <tbody>${outRows}</tbody></table></div>` : ''}`;
  }

  // พับ/กางไตรมาสที่ทวนอยู่ — ไม่แตะข้อมูล แค่เปลี่ยนมุมมอง (เหมือนขั้น 1)
  // + ปุ่ม "ยืนยัน<ไตรมาส>" อยู่ในเนื้อของแต่ละไตรมาสที่พร้อมแล้วเอง (ย้ายออกจาก shell กลาง 28 ส.ค. 2569
  // แล้วแตกเป็นรายไตรมาสอีกรอบ — เจ้าของงานสั่งให้ยืนยันได้ทีละไตรมาสตามที่เสร็จจริง ไม่ใช่ปุ่มเดียวทั้งแผน)
  function bindProcStep3(plan) {
    document.querySelectorAll('[data-toggle-review-q]').forEach(head => {
      head.addEventListener('click', () => {
        const q = head.dataset.toggleReviewQ;
        S.expanded[q] = !S.expanded[q];
        S.q = q;
        HOST.onChange();
      });
    });
    document.querySelectorAll('[data-confirm-q]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.confirmQ;
        MYD.confirmTravelQuarter(plan, q, nowTh());
        MYD.savePlan(plan);
        toast(`ยืนยันแผนเดินทาง${MYD.quarterLabel(q)}แล้ว`);
        HOST.onConfirm(q);   // ส่งไตรมาสที่เพิ่งยืนยันไปด้วย — host ตัดสินใจเองว่าจะพาไปไหนต่อ
      });
    });
  }

  // ----- เฟส 2 (แผนเดินทาง) — รวมขั้น "ทำแผนเดินทาง" + "ทวน + ยืนยัน" เป็นการ์ดเดียวต่อไตรมาส (28 ส.ค. 2569 รอบ 3) -----
  // เจ้าของงานสั่งย้าย stepper 2 ขั้น (แผนเดินทาง / ทวน+ยืนยัน) ที่เดิมอยู่ระดับหน้า (คุมทุกไตรมาสพร้อมกัน) เข้าไป
  // อยู่ "ภายในการ์ดของแต่ละไตรมาส" แทน — แต่ละไตรมาสเลือกขั้นของตัวเองอิสระ ไตรมาสหนึ่งดูขั้น "ทวน+ยืนยัน" อยู่
  // ไตรมาสอื่นยังแก้ขั้น "ทำแผนเดินทาง" ได้พร้อมกัน · S.step[q] เก็บขั้นของแต่ละไตรมาส (memory เท่านั้น เหมือน
  // S.expanded) ค่าเริ่มต้น 1 · ใช้เฉพาะ host ที่ไม่มี stepper ของ shell ตัวเองแล้ว (index.html — ดู opts.showConfirm)
  // trip-plan.html ยังใช้ renderProcStep2/renderProcStep3 (stepper ระดับหน้าเดิม) ไม่ได้แตะ
  function renderTravelAccordion(plan, opts) {
    opts = opts || {};
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    MYD.ensurePlanQuarters(plan);
    if (!MYD.QUARTER_KEYS.includes(S.q)) S.q = 'Q1';
    if (!S.expanded) S.expanded = {};
    if (!S.step) S.step = {};
    // ไตรมาสที่เพิ่งดู/แก้ล่าสุด (S.q) เริ่มต้นแบบกางไว้ก่อน ไตรมาสอื่นพับ (เหมือน renderProcStep2/3 เดิม)
    if (!(S.q in S.expanded)) S.expanded[S.q] = true;

    const accepted = trips.filter(t => MYD.tripStatus(t, master) === 'accepted').length;
    const noneIds = MYD.planVehicleIds(plan, 'none');
    const grand = trips.reduce((n, t) => n + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);

    const outRows = (plan.selectedVehicleIds || [])
      .filter(id => !MYD.isVehicleIn(plan, id))
      .map(id => {
        const v = master.vehicles.find(x => x.id === id);
        const e = MYD.vehicleConfirm(plan, id);
        return `<tr><td>${esc(v ? v.plate : id)}</td>
          <td>${esc(CF_VERDICT_LABELS[e.verdict] || 'ไม่พร้อม')}</td>
          <td>${esc(e.verdictWhy || e.reason || '—')}</td></tr>`;
      }).join('');

    const qBlocks = MYD.QUARTER_KEYS.map(q => {
      const months = QUARTERS.find(x => x.q === q).months;
      const joiningQ = MYD.planVehicleIds(plan, q).filter(id => MYD.isVehicleIn(plan, id));
      const ready = MYD.quarterTravelReady(plan, master, q);
      const confirmedAt = (plan.travelConfirmedByQuarter || {})[q];
      const quarterTrips = trips.filter(t => tripQuarterOf(t, plan) === q);
      const expanded = !!S.expanded[q];
      const step = S.step[q] || 1;
      const badge = confirmedAt
        ? '<span class="badge b-ok">ยืนยันแล้ว</span>'
        : `<span class="badge ${ready ? 'b-ok' : 'b-neutral'}">${ready ? 'พร้อมแล้ว' : 'ยังไม่ครบ'}</span>`;

      // mini-stepper 2 ขั้นในการ์ดไตรมาสนี้เอง — คลาสเดียวกับ .wsteps.sm ที่ใช้ระดับหน้าอยู่แล้ว ไม่มี CSS ใหม่
      const miniStep = (n, label) => {
        const active = step === n, passed = step > n;
        const cls = ['wstep']; if (active) cls.push('active'); if (passed) cls.push('passed');
        return `<div class="${cls.join(' ')}" data-qstep="${q}" data-qstep-n="${n}">
          <span class="num">${passed ? '✓' : n}</span><span class="lbl">${label}</span></div>`;
      };
      const body = !expanded ? '' : `
        <div class="wsteps sm" style="margin-bottom:14px">${miniStep(1, 'แผนเดินทาง')}${miniStep(2, 'ทวน + ยืนยัน')}</div>
        ${step === 1
          ? renderTravelStep1Content(plan, master, trips, q)
          : renderTravelStep2Content(plan, master, trips, q, opts)}`;

      return `
        <div class="rzone" data-q="${q}">
          <div class="rzone-head" data-toggle-q="${q}">
            <span class="ms rzone-caret">${expanded ? 'expand_more' : 'chevron_right'}</span>
            <b>${esc(MYD.quarterLabel(q))}</b>
            <span class="rzone-count">${esc(months)} · ${joiningQ.length} คัน · แผนเดินทาง ${quarterTrips.length} ใบ</span>
            ${badge}
          </div>
          ${expanded ? `<div class="rzone-body">${body}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="sect">แผนเดินทาง</div>
      ${noneIds.length ? `<div class="note note-info"><span class="ms">inbox</span>
        <div>มีรถ <b>${noneIds.length}</b> คันถูกพักไว้แบบ <b>ยังไม่ระบุไตรมาส</b> — ยังอยู่ในแผน
        แต่จะไม่โผล่ในไตรมาสไหนจนกว่าจะย้ายกลับเข้าไตรมาส</div></div>` : ''}
      <div class="sub">แผนเดินทางทั้งหมด <b>${trips.length}</b> ใบ · ตอบรับครบแล้ว <b>${accepted}</b> ใบ
        · รวมค่าใช้จ่ายทั้งหมด <b>${grand.toLocaleString('th-TH')}</b> บาท
        · รถที่ยังไม่อยู่ในใบไหนเลย <b>${MYD.unassignedVehicleIds(plan).length}</b> คัน
        <small>(รถที่พักไว้แบบยังไม่ระบุไตรมาสไม่นับ)</small></div>
      <div class="sub">แผนหนึ่งมีได้หลายใบ — จะแยกตามจังหวัด หรือจังหวัดละหลายใบก็ได้ · แต่ละใบเสนอเป็น<b>ช่วงเวลา</b>
        แล้วหน่วยงานเจ้าของรถเลือกวันนัดของรถแต่ละคันภายในช่วงนั้นเอง</div>
      <div class="sub">กดที่แต่ละไตรมาสด้านล่างเพื่อขยายดู — ข้างในมีขั้น "แผนเดินทาง" / "ทวน + ยืนยัน" ของไตรมาสนั้นให้สลับเอง</div>
      <div class="stack">${qBlocks}</div>
      ${outRows ? `
      <div class="sect">รถที่ไม่เข้าแผนเดินทางรอบนี้</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>คำตัดสิน กบค.</th><th>เหตุผล</th></tr></thead>
        <tbody>${outRows}</tbody></table></div>` : ''}`;
  }

  function bindTravelAccordion(plan) {
    bindProcStep2(plan);   // ครอบคลุม data-toggle-q + ทุกอย่างของขั้น "ทำแผนเดินทาง" (สร้าง/แก้ใบ ฯลฯ)
    bindProcStep3(plan);   // ครอบคลุมปุ่ม "ยืนยัน<ไตรมาส>" (data-confirm-q) — data-toggle-review-q ไม่มีในมาร์กอัปนี้ ไม่มีผล

    // สลับขั้นย่อยภายในการ์ดไตรมาส (แผนเดินทาง / ทวน + ยืนยัน) — อิสระต่อไตรมาส ไม่ผูกกับไตรมาสอื่น (28 ส.ค. 2569 รอบ 3)
    document.querySelectorAll('[data-qstep]').forEach(tab => {
      tab.addEventListener('click', () => {
        S.step = S.step || {};
        S.step[tab.dataset.qstep] = Number(tab.dataset.qstepN);
        HOST.onChange();
      });
    });
  }

  function confirmTravelPlan(plan) {
    plan.travelConfirmed = true;
    MYD.savePlan(plan);
    toast('ยืนยันแผนเดินทางสำเร็จ');
    // host เป็นคนตัดสินว่าจะพาไปไหนต่อ — โมดูลไม่รู้จัก stepper/เฟส
  }

  // ----- สรุปหลังยืนยัน (แทนที่ wizard เมื่อ travelConfirmed===true) -----
  function renderTravelConfirmed(plan, opts) {
    opts = opts || {};
    const selectedVehicles = MYD.loadMaster().vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
    const joiningCount = selectedVehicles.filter(v => MYD.isVehicleIn(plan, v.id)).length;
    const master = MYD.loadMaster();
    const trips = MYD.ensureTrips(plan);
    const grand = trips.reduce((n, t) => n + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);

    const tripRows = trips.map(t => {
      const vs = tripVehicles(t, master);
      const sum = (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0);
      return `<tr>
        <td><b>${esc(t.name || 'แผนเดินทาง')}</b><div class="sub">${esc(t.location || '—')}</div></td>
        <td>${dateTh(t.windowFrom)} – ${dateTh(t.windowTo)}</td>
        <td class="num">${vs.length}</td>
        <td class="num">${sum.toLocaleString('th-TH')}</td>
        <td>${MYD.tripDepts(t, master).join(' · ')}</td>
      </tr>`;
    }).join('');

    return `
      <div class="card">
        <div class="sect">แผนเดินทาง — ยืนยันแล้ว</div>
        <span class="badge b-ok" style="font-size:var(--fs-body);padding:6px 16px">แผนเดินทางยืนยันแล้ว</span>
        <div class="sub" style="margin-top:12px">แผนเดินทาง <b>${trips.length}</b> ใบ
          · รวมค่าใช้จ่าย <b>${grand.toLocaleString('th-TH')}</b> บาท · ทุกใบได้รับการตอบรับจากหน่วยงานแล้ว</div>
        ${trips.length ? `<div class="tblwrap"><table class="tbl">
          <thead><tr><th>แผน / สถานที่</th><th>ช่วงที่นัด</th><th class="num">รถ</th>
            <th class="num">ค่าใช้จ่าย</th><th>หน่วยงานที่ตอบรับ</th></tr></thead>
          <tbody>${tripRows}</tbody></table></div>` : ''}
      </div>
      <div class="card">
        <div class="sect"><span class="ms">mail</span> ส่ง Noti แจ้งเจ้าของรถ ${joiningCount} คัน + กรย. วันที่เข้าตรวจ</div>
        <div class="sub">ระบบส่งการแจ้งเตือนอัตโนมัติแล้ว (mock)</div>
      </div>
      <div class="card">
        <div class="actions">
          <button class="btn btn-o" id="btnPeaLife">ทำใบนำจ่าย (PEA Life)</button>
          ${opts.onNextPhase ? '<button class="btn btn-p" id="btnGoNextPhaseProc">ไปเฟสถัดไป →</button>' : ''}
        </div>
      </div>`;

  }

  // ผูกปุ่มของหน้าสรุป — ปุ่ม "ไปเฟสถัดไป" มีเฉพาะเมื่อ host ส่ง onNextPhase มา
  // (หน้าเดี่ยว trip-plan.html ไม่มีเฟสถัดไป จึงไม่ส่งมา)
  function bindTravelConfirmed(opts) {
    opts = opts || {};
    const pea = $('btnPeaLife');
    if (pea) pea.addEventListener('click', () => toast('สร้างใบนำจ่าย (PEA Life) สำเร็จ (mock)'));
    const next = $('btnGoNextPhaseProc');
    if (next && opts.onNextPhase) next.addEventListener('click', opts.onNextPhase);
  }

  // ==========================================================================
  // สายงานซ่อม (SC-15 ออกซ่อมหน้างาน · UC-15.1 ทำแผนเดินทาง) — 25 ส.ค. 2569
  // ==========================================================================
  // เจ้าของงานสั่ง: "โครงสร้างเหมือนหน้า[แผนเดินทางบำรุงรักษา]ได้เลย ตัดตรงเลือกไตรมาสออกไป"
  // + "เอาปุ่มแยกอัตโนมัติตามจังหวัดออก"
  // ⇒ โครงกล่อง/ฟอร์ม/ตาราง ใช้ชุดเดียวกับสายบำรุงรักษาเป๊ะ ต่างกันแค่:
  //   - ไม่มีตัวเลือกไตรมาส · ไม่มีปุ่มแยกอัตโนมัติ
  //   - หน่วยของงานคือ "ใบแจ้งซ่อม" ไม่ใช่ "รถในแผนประจำปี" · 1 ใบเดินทางรวมได้หลายใบแจ้งซ่อม
  //   - งานที่จะทำ = อาการเสียจากใบแจ้งซ่อม (อ่านอย่างเดียว) ไม่ใช่ติ๊กเอง
  //   - เพิ่ม 2 ช่องที่ UC-15.1 ขอ: จุดนัดรับรถ · รถที่ใช้เดินทาง
  // ⚠️ ขอบเขตรอบนี้ = "จังหวะสร้างแผน" เท่านั้น — จบที่ส่งแผนนัด
  //    (ฝั่งหน่วยงานตอบรับ · ขั้นขออนุมัติ · ยืนยันแผน ยังไม่ทำ)

  // จัดใบแจ้งซ่อมเป็นกลุ่มตามจังหวัด — ทีมช่างออกทริปเดียวเก็บงานในจังหวัดเดียวกันเป็นปกติ
  // เรียงจังหวัดที่มีใบเยอะสุดขึ้นก่อน (เท่ากันเรียงตามชื่อไทย) เพื่อให้เห็นจังหวัดที่คุ้มจะออกทริปทันที
  function groupByProvince(jobs) {
    const g = {};
    jobs.forEach(j => (g[j.province] = g[j.province] || []).push(j));
    return g;
  }
  function provinceOrder(jobs) {
    const g = groupByProvince(jobs);
    return Object.keys(g).sort((a, b) => g[b].length - g[a].length || a.localeCompare(b, 'th'));
  }

  function repairTripBoxes(trips) {
    return trips.map(trip => {
      const locked = !!trip.sentAt;
      const dis = locked ? 'disabled' : '';
      const jobs = (trip.jobNos || []).map(no => MYD.repairJobByNo(no)).filter(Boolean);
      const days = MYD.repairTripDays(trip);
      const perDiemSum = MYD.repairTripPerDiemSum(trip) * (days || 1);
      const grand = perDiemSum + (Number(trip.lodging) || 0) + (Number(trip.travel) || 0);
      const blockers = MYD.repairTripBlockers(trip);

      const rows = jobs.map(j => {
        const u = MYD.URGENCY[j.urgency] || MYD.URGENCY.normal;
        return `<tr>
          <td><b>${esc(j.no)}</b><div class="cell-sub">แจ้งเมื่อ ${esc(j.reportedAt)}</div></td>
          <td><b>${esc(j.plate)}</b><div class="cell-sub cell-clip" title="${esc(j.model)}">${esc(j.model)}</div></td>
          <td>${esc(j.ownerDept)}<div class="cell-sub">${esc(j.province)}</div></td>
          <td>${j.syms.map(x => `<span class="badge b-neutral">${esc(x)}</span>`).join(' ')}
              <div class="cell-sub">${esc(j.target)}</div></td>
          <td><span class="badge ${u.cls}">${esc(u.text)}</span></td>
          <td class="num">${locked ? '' : `<button class="btn btn-g btn-sm" data-rdrop="${esc(trip.id)}" data-rjob="${esc(j.no)}">เอาออกจากใบนี้</button>`}</td>
        </tr>`;
      }).join('');

      const pool = MYD.unassignedRepairJobs(trips);
      const byProv = {};
      pool.forEach(j => (byProv[j.province] = byProv[j.province] || []).push(j));
      const addOpts = Object.keys(byProv).sort((a, b) => a.localeCompare(b, 'th')).map(prov =>
        `<optgroup label="${esc(prov)} (${byProv[prov].length} ใบ)">${byProv[prov].map(j =>
          `<option value="${esc(j.no)}">${esc(j.no)} · ${esc(j.plate)} — ${esc(j.ownerDept)}</option>`).join('')}</optgroup>`).join('');

      return `
      <div class="rzone">
        <div class="rzone-head">
          <span class="ms rzone-caret">event_available</span>
          <b>${esc(trip.name || 'แผนเดินทางซ่อม')}</b>
          <span class="rzone-count">${jobs.length} ใบแจ้งซ่อม · ${MYD.repairTripDepts(trip).length} หน่วยงาน · ${grand.toLocaleString('th-TH')} บาท</span>
          <span class="badge ${locked ? 'b-low' : 'b-neutral'}">${locked ? 'รอตอบรับ' : 'ยังไม่ส่ง'}</span>
        </div>
        <div class="rzone-body">
          <div class="fgrid">
            <div class="f sp2"><label>ชื่อแผน</label>
              <div class="in"><span class="ms">label</span>
                <input type="text" value="${esc(trip.name || '')}" ${dis}
                  placeholder="เช่น ขอนแก่น รอบ 1" data-rtrip="${esc(trip.id)}" data-field="name"></div></div>
            <div class="f sp2"><label>สถานที่ซ่อม</label>
              <div class="in"><span class="ms">place</span>
                <input type="text" value="${esc(trip.location || '')}" ${dis}
                  placeholder="เช่น กฟจ.ขอนแก่น" data-rtrip="${esc(trip.id)}" data-field="location"></div></div>
            <div class="f"><label>ช่วงที่เสนอ — จากวันที่</label>
              <div class="in noic"><input type="date" value="${esc(trip.windowFrom || '')}" ${dis}
                data-rtrip="${esc(trip.id)}" data-field="windowFrom"></div></div>
            <div class="f"><label>ถึงวันที่</label>
              <div class="in noic"><input type="date" value="${esc(trip.windowTo || '')}" ${dis}
                data-rtrip="${esc(trip.id)}" data-field="windowTo"></div></div>
            <div class="f ro sp2"><label>รวมกี่วัน <small>คิดให้อัตโนมัติ</small></label>
              <div class="in noic"><input type="text" value="${days ? days + ' วัน' : '—'}" readonly></div></div>
          </div>

          <div class="sect">ข้อมูลเฉพาะการออกซ่อมหน้างาน</div>
          <div class="sub">สองช่องนี้มีเฉพาะสายงานซ่อม — สายบำรุงรักษาตามวาระไม่มี</div>
          <div class="fgrid">
            <div class="f sp2"><label>จุดนัดรับรถ</label>
              <div class="in"><span class="ms">pin_drop</span>
                <input type="text" value="${esc(trip.pickupPoint || '')}" ${dis}
                  placeholder="เช่น สนง.ใหญ่ กบค." data-rtrip="${esc(trip.id)}" data-field="pickupPoint"></div></div>
            <div class="f sp2"><label>รถที่ใช้เดินทาง</label>
              <div class="in"><span class="ms">local_shipping</span>
                <input type="text" value="${esc(trip.crewVehicle || '')}" ${dis}
                  placeholder="เช่น กข-1234 กรุงเทพมหานคร (รถตู้ซ่อมบำรุง)" data-rtrip="${esc(trip.id)}" data-field="crewVehicle"></div></div>
            <div class="f sp4"><label>รายละเอียดเพิ่มเติม <small>ไม่บังคับ</small></label>
              <div class="in"><span class="ms">notes</span>
                <input type="text" value="${esc(trip.note || '')}" ${dis}
                  placeholder="เช่น นัดเวลา 09:00 ที่ป้อมยาม" data-rtrip="${esc(trip.id)}" data-field="note"></div></div>
          </div>

          <div class="sect">ช่างผู้รับผิดชอบ</div>
          <div class="sub">ใส่ชื่อไว้เพื่อให้หน่วยงานเจ้าของรถรู้ว่าใครจะไป
            · ค่าเบี้ยเลี้ยงกรอกเป็น<b>อัตราต่อวัน</b>รายคน ระบบคูณจำนวนวันของช่วงที่เสนอแล้วรวมให้ด้านล่าง</div>
          <div class="fgrid">
            ${(trip.staff || ['']).map((name, i) => `
              <div class="f sp3"><label>คนที่ ${i + 1}</label>
                <div class="in"><span class="ms">engineering</span>
                  <input type="text" value="${esc(name || '')}" ${dis} placeholder="ชื่อ-สกุล"
                    data-rstaff="${esc(trip.id)}" data-rstaff-i="${i}"></div></div>
              <div class="f"><label>ค่าเบี้ยเลี้ยง/วัน (บาท)</label>
                <div class="in noic"><input type="number" min="0" value="${esc((trip.staffPerDiem || [])[i] ?? 0)}" ${dis}
                  data-rstaffpd="${esc(trip.id)}" data-rstaffpd-i="${i}"></div></div>`).join('')}
          </div>
          ${locked ? '' : `<div class="actions" style="justify-content:flex-start">
            <button class="btn btn-t btn-sm" data-rstaff-add="${esc(trip.id)}"><span class="ms">add</span> เพิ่มคน</button>
            ${(trip.staff || []).length > 1 ? `<button class="btn btn-t btn-sm" data-rstaff-del="${esc(trip.id)}"><span class="ms">remove</span> ลดคน</button>` : ''}
          </div>`}

          <div class="fgrid">
            <div class="f ro"><label>ค่าเบี้ยเลี้ยงรวม (บาท) <small>คิดให้อัตโนมัติ</small></label>
              <div class="in noic"><input type="number" value="${esc(perDiemSum)}" readonly></div>
              <div class="cell-sub">${MYD.repairTripPerDiemSum(trip).toLocaleString('th-TH')} บาท/วัน × ${days || 1} วัน</div></div>
            <div class="f"><label>ค่าที่พัก (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.lodging ?? 0)}" ${dis}
                data-rtrip="${esc(trip.id)}" data-field="lodging"></div></div>
            <div class="f"><label>ค่าเดินทาง (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.travel ?? 0)}" ${dis}
                data-rtrip="${esc(trip.id)}" data-field="travel"></div></div>
            <div class="f"><label>รวม</label><div><b>${grand.toLocaleString('th-TH')} บาท</b></div></div>
          </div>

          <div class="sect">ใบแจ้งซ่อมในแผนนี้</div>
          <div class="sub">หนึ่งใบเดินทางรวมได้หลายใบแจ้งซ่อม — งานที่จะทำมาจากอาการที่แจ้งไว้ แก้ที่นี่ไม่ได้</div>
          ${jobs.length ? `<div class="tblwrap"><table class="tbl">
            <thead><tr><th>เลขที่ใบแจ้งซ่อม</th><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th>
              <th>อาการที่แจ้ง</th><th>ความเร่งด่วน</th><th></th></tr></thead>
            <tbody>${rows}</tbody></table></div>`
            : `<div class="empty">ยังไม่มีใบแจ้งซ่อมในแผนนี้ — เลือกจากรายการด้านล่าง</div>`}

          ${locked ? '' : `
          <div class="fgrid">
            <div class="f sp3"><label>เพิ่มใบแจ้งซ่อมเข้าแผนนี้ <small>เลือกจากใบที่ยังไม่ถูกจัด</small></label>
              <div class="in"><span class="ms">build</span>
                <select data-radd-sel="${esc(trip.id)}" ${addOpts ? '' : 'disabled'}>
                  ${addOpts || '<option>— จัดครบทุกใบแล้ว —</option>'}</select></div></div>
            <div class="f"><label>&nbsp;</label>
              <button class="btn btn-s" data-radd="${esc(trip.id)}" ${addOpts ? '' : 'disabled'}>เพิ่ม</button></div>
          </div>`}

          <div data-rblockers="${esc(trip.id)}">${(!locked && blockers.length) ? `<div class="note note-warn"><span class="ms">error</span>
            <div><b>ส่งแผนนัดยังไม่ได้</b> — ต้องเคลียร์ ${blockers.length} เรื่องนี้ก่อน
              <ul style="margin:6px 0 0 18px">${blockers.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : ''}</div>

          <div class="actions">
            ${locked
              ? `<button class="btn btn-g" disabled>ส่งแล้ว แก้ไม่ได้</button>`
              : `<button class="btn btn-g" data-rdel="${esc(trip.id)}">ลบแผนนี้</button>
                 <button class="btn btn-o" data-rsend="${esc(trip.id)}" ${MYD.repairTripSendable(trip) ? '' : 'disabled'}>
                   <span class="ms">send</span> ส่งแผนนัดให้หน่วยงาน</button>`}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function renderRepairStep1() {
    const trips = repairTrips();
    // 🔑 เข้าพูลได้เฉพาะใบที่เลือก "จัดซ่อมที่หน้างาน" — ใบที่นัดเข้ามาซ่อมที่ กบค. ไม่ต้องเดินทาง
    const onsite = MYD.onsiteRepairJobs();
    const offsite = MYD.offsiteRepairJobs();
    const unassigned = MYD.unassignedRepairJobs(trips);

    const offsiteRows = offsite.map(j => `<tr>
      <td><b>${esc(j.no)}</b><div class="cell-sub">แจ้งเมื่อ ${esc(j.reportedAt)}</div></td>
      <td><b>${esc(j.plate)}</b><div class="cell-sub cell-clip" title="${esc(j.model)}">${esc(j.model)}</div></td>
      <td>${esc(j.ownerDept)}<div class="cell-sub">${esc(j.province)}</div></td>
      <td><span class="badge b-neutral">เข้าซ่อมที่ กบค.</span></td>
    </tr>`).join('');

    return `
      <div class="sect">ขั้นที่ 1: ทำแผนเดินทาง</div>
      <div class="sub"><b>มีรถที่ต้องออกไปซ่อม ${onsite.length} คัน</b>
        — จัดเข้าใบแล้ว <b>${onsite.length - unassigned.length}</b> · ยังไม่จัด <b>${unassigned.length}</b>
        · แผนเดินทาง <b>${trips.length}</b> ใบ</div>
      ${unassigned.length ? `<div class="sub">ที่ยังไม่จัด แยกตามจังหวัด:
        ${provinceOrder(unassigned).map(pv => `<b>${esc(pv)}</b> ${groupByProvince(unassigned)[pv].length} ใบ`).join(' · ')}</div>` : ''}
      <div class="note note-info"><span class="ms">filter_alt</span>
        <div><b>นับเฉพาะใบที่เลือก "จัดซ่อมที่หน้างาน"</b> ในหัวข้อ <i>รูปแบบการซ่อม</i> ของใบแจ้งซ่อม
          — ใบที่เลือก <i>เข้าซ่อมที่ กบค.</i> ไม่ต้องเดินทาง จึงไม่เข้าแผนนี้
          ${offsite.length ? `(รอบนี้ถูกกันออก <b>${offsite.length}</b> ใบ ดูท้ายหน้า)` : ''}</div></div>
      <div class="sub">หนึ่งใบเดินทางรวมใบแจ้งซ่อมได้หลายใบ · แต่ละใบเสนอเป็น<b>ช่วงเวลา</b>
        แล้วหน่วยงานเจ้าของรถเลือกวันนัดภายในช่วงนั้นเอง (เหมือนสายบำรุงรักษา)</div>
      <div class="actions" style="justify-content:flex-start">
        <button class="btn btn-o" id="btnAddRepairTrip"><span class="ms">add</span> สร้างแผนเดินทางใหม่</button>
      </div>
      ${trips.length ? repairTripBoxes(trips) : `<div class="empty">ยังไม่มีแผนเดินทาง — กดสร้างแผนใหม่</div>`}
      ${unassigned.length ? `
        <div class="sect">ใบแจ้งซ่อมที่ยังไม่ถูกจัดเข้าแผน — แยกตามจังหวัด</div>
        <div class="sub">ทีมหนึ่งมักออกทริปเดียวเก็บงานในจังหวัดเดียวกัน — ดูตรงนี้ว่าจังหวัดไหนมีกี่ใบ
          แล้วค่อยตัดสินว่าจะรวมเป็นทริปเดียวหรือแยก</div>
        <div class="stack">
        ${provinceOrder(unassigned).map(pv => {
          const js = groupByProvince(unassigned)[pv];
          return `<div class="rzone">
            <div class="rzone-head">
              <span class="ms rzone-caret">location_on</span>
              <b>${esc(pv)}</b>
              <span class="rzone-count">${js.length} ใบแจ้งซ่อม · ${new Set(js.map(j => j.ownerDept)).size} หน่วยงาน</span>
            </div>
            <div class="rzone-body flush"><div class="tblwrap"><table class="tbl">
              <thead><tr><th>เลขที่ใบแจ้งซ่อม</th><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th>
                <th>อาการที่แจ้ง</th><th>ความเร่งด่วน</th></tr></thead>
              <tbody>${js.map(j => {
                const u = MYD.URGENCY[j.urgency] || MYD.URGENCY.normal;
                return `<tr>
                  <td><b>${esc(j.no)}</b><div class="cell-sub">แจ้งเมื่อ ${esc(j.reportedAt)}</div></td>
                  <td><b>${esc(j.plate)}</b><div class="cell-sub cell-clip" title="${esc(j.model)}">${esc(j.model)}</div></td>
                  <td>${esc(j.ownerDept)}</td>
                  <td>${j.syms.map(x => `<span class="badge b-neutral">${esc(x)}</span>`).join(' ')}</td>
                  <td><span class="badge ${u.cls}">${esc(u.text)}</span></td>
                </tr>`;
              }).join('')}</tbody></table></div></div>
          </div>`;
        }).join('')}
        </div>` : ''}
      ${offsite.length ? `
        <div class="sect">ใบแจ้งซ่อมที่ไม่เข้าแผนเดินทาง</div>
        <div class="sub">เลือก <b>เข้าซ่อมที่ กบค.</b> — เจ้าของรถขนรถมาที่สำนักงานใหญ่ ไม่ต้องจัดทีมเดินทาง
          · ถ้าเปลี่ยนรูปแบบการซ่อมเป็น <b>จัดซ่อมที่หน้างาน</b> ใบนั้นจะขึ้นมาให้จัดในแผนเดินทางเอง</div>
        <div class="tblwrap"><table class="tbl">
          <thead><tr><th>เลขที่ใบแจ้งซ่อม</th><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>รูปแบบการซ่อม</th></tr></thead>
          <tbody>${offsiteRows}</tbody></table></div>` : ''}`;
  }

  function wireRepairStep1() {
    const trips = repairTrips();
    const find = id => trips.find(t => t.id === id);
    const rerender = () => { MYD.saveRepairTrips(trips); HOST.onChange(); };

    const add = $('btnAddRepairTrip');
    if (add) add.addEventListener('click', () => {
      trips.push(MYD.emptyRepairTrip('rtrip-' + Date.now().toString(36), `แผนเดินทางซ่อม ${trips.length + 1}`));
      rerender();
    });

    // ⚠️ พิมพ์แล้ว **ห้าม re-render** — บันทึกทันทีแล้ว sync เฉพาะปุ่ม/กล่องเตือนพอ
    // เป็นแพตเทิร์นเดียวกับสายบำรุงรักษา (syncSendBtn) · ตอนแรกผมทำเป็น re-render ทั้งหน้าตอน
    // change แล้วเจอบั๊ก: การวาดใหม่ทับค่าที่เพิ่งกรอกลงไป ค่าหายเงียบๆ ทีละช่อง
    const syncSend = t => {
      const btn = document.querySelector(`[data-rsend="${t.id}"]`);
      if (btn) btn.disabled = !MYD.repairTripSendable(t);
      const box = document.querySelector(`[data-rblockers="${t.id}"]`);
      if (box) {
        const bl = MYD.repairTripBlockers(t);
        box.innerHTML = bl.length ? `<div class="note note-warn"><span class="ms">error</span>
          <div><b>ส่งแผนนัดยังไม่ได้</b> — ต้องเคลียร์ ${bl.length} เรื่องนี้ก่อน
            <ul style="margin:6px 0 0 18px">${bl.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>` : '';
      }
    };

    const onType = (sel, apply) => document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('input', () => {
        const t = apply(el);
        if (!t) return;
        MYD.saveRepairTrips(trips);
        syncSend(t);
      });
    });

    onType('[data-rtrip]', el => {
      const t = find(el.dataset.rtrip);
      if (!t || t.sentAt) return null;
      const f = el.dataset.field;
      t[f] = (el.type === 'number') ? (Number(el.value) || 0) : el.value;
      return t;
    });

    onType('[data-rstaff]', el => {
      const t = find(el.dataset.rstaff);
      if (!t || t.sentAt) return null;
      t.staff[Number(el.dataset.rstaffI)] = el.value;
      return t;
    });

    onType('[data-rstaffpd]', el => {
      const t = find(el.dataset.rstaffpd);
      if (!t || t.sentAt) return null;
      t.staffPerDiem[Number(el.dataset.rstaffpdI)] = Number(el.value) || 0;
      return t;
    });

    document.querySelectorAll('[data-rstaff-add]').forEach(b => b.addEventListener('click', () => {
      const t = find(b.dataset.rstaffAdd);
      if (!t) return;
      t.staff.push(''); t.staffPerDiem.push(0); rerender();
    }));
    document.querySelectorAll('[data-rstaff-del]').forEach(b => b.addEventListener('click', () => {
      const t = find(b.dataset.rstaffDel);
      if (!t || t.staff.length <= 1) return;
      t.staff.pop(); t.staffPerDiem.pop(); rerender();
    }));

    document.querySelectorAll('[data-radd]').forEach(b => b.addEventListener('click', () => {
      const t = find(b.dataset.radd);
      const sel = document.querySelector(`[data-radd-sel="${b.dataset.radd}"]`);
      if (!t || !sel || !sel.value) return;
      t.jobNos.push(sel.value);
      rerender();
    }));
    document.querySelectorAll('[data-rdrop]').forEach(b => b.addEventListener('click', () => {
      const t = find(b.dataset.rdrop);
      if (!t) return;
      t.jobNos = t.jobNos.filter(x => x !== b.dataset.rjob);
      rerender();
    }));

    document.querySelectorAll('[data-rdel]').forEach(b => b.addEventListener('click', () => {
      const i = trips.findIndex(t => t.id === b.dataset.rdel);
      if (i < 0) return;
      trips.splice(i, 1);
      rerender();
    }));

    document.querySelectorAll('[data-rsend]').forEach(b => b.addEventListener('click', () => {
      const t = find(b.dataset.rsend);
      if (!t || !MYD.repairTripSendable(t)) return;
      t.sentAt = nowTh();
      toast('ส่งแผนนัดให้หน่วยงานแล้ว');
      rerender();
    }));
  }

  window.TRIP = {
    state: S,
    blockers: travelBlockers,
    sendable: tripSendable,
    renderStep1: renderProcStep2,
    bindStep1(plan, opts) {
      opts = opts || {};
      HOST.onChange = opts.onChange || function () {};
      HOST.onValidity = opts.onValidity || function () {};
      bindProcStep2(plan);
    },
    renderStep2: renderProcStep3,
    bindStep2(plan, opts) {
      opts = opts || {};
      HOST.onChange = opts.onChange || function () {};
      HOST.onValidity = opts.onValidity || function () {};
      HOST.onConfirm = opts.onConfirm || function () {};
      bindProcStep3(plan);
    },
    // การ์ดไตรมาสเดียว รวมขั้น "ทำแผนเดินทาง"/"ทวน+ยืนยัน" ไว้ข้างในเอง (28 ส.ค. 2569 รอบ 3) — ใช้แทน
    // renderStep1/renderStep2 คู่บน สำหรับ host ที่ไม่มี stepper 2 ขั้นระดับหน้าของตัวเองแล้ว (index.html)
    renderTravel: renderTravelAccordion,
    bindTravel(plan, opts) {
      opts = opts || {};
      HOST.onChange = opts.onChange || function () {};
      HOST.onConfirm = opts.onConfirm || function () {};
      bindTravelAccordion(plan);
    },
    confirm: confirmTravelPlan,
    renderConfirmed: renderTravelConfirmed,
    bindConfirmed: bindTravelConfirmed,

    // --- สายงานซ่อม (SC-15) — ขอบเขตรอบนี้: เฉพาะจังหวะสร้างแผน จบที่ส่งแผนนัด ---
    renderRepairStep1,
    bindRepairStep1(opts) {
      opts = opts || {};
      HOST.onChange = opts.onChange || function () {};
      HOST.onValidity = opts.onValidity || function () {};
      wireRepairStep1();
    },
  };
})();
