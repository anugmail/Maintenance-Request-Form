#!/usr/bin/env bash
# เรนเดอร์ .puml ทุกไฟล์ในโฟลเดอร์นี้ → out/*.png + out/*.svg
# ต้องมี java (มีอยู่แล้ว) · plantuml.jar เก็บไว้ "นอกรีโป" ที่ ~/PEA/Maintain-D/.tools/
# ไม่ต้องลง graphviz — activity diagram ใช้ engine ในตัวของ PlantUML
set -euo pipefail
cd "$(dirname "$0")"
JAR="${PLANTUML_JAR:-$HOME/PEA/Maintain-D/.tools/plantuml.jar}"
VER="v1.2025.4"
if [ ! -f "$JAR" ]; then
  echo "→ ไม่พบ plantuml.jar — ดาวน์โหลดไปที่ $JAR"
  mkdir -p "$(dirname "$JAR")"
  curl -sSL -o "$JAR" "https://github.com/plantuml/plantuml/releases/download/$VER/plantuml-${VER#v}.jar"
fi
mkdir -p out
# ผังแนวนอนกว้างเกิน 4096px (ค่า default) จะถูกตัดขอบ — ขยาย limit ให้พอ
java -DPLANTUML_LIMIT_SIZE=16384 -jar "$JAR" -tpng -o out ./*.puml
java -DPLANTUML_LIMIT_SIZE=16384 -jar "$JAR" -tsvg -o out ./*.puml
ls -la out/
