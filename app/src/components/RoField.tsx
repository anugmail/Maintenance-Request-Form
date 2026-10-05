// ช่องอ่านอย่างเดียว (.f.ro) — ใช้ในหน้ารายละเอียดแผนและ modal อนุมัติ
export function RoField({ label, icon, value, span }: { label: string; icon: string; value: string; span?: string }) {
  return (
    <div className={`f ro${span ? ` ${span}` : ""}`}>
      <label>{label}</label>
      <div className="in">
        <span className="ms">{icon}</span>
        <input type="text" value={value} readOnly />
      </div>
    </div>
  );
}
