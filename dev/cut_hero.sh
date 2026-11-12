#!/bin/bash
# usage: dev/cut_hero.sh <id>  (assets/raw/aot_hero_<id>.png -> hero_<id>_*, herofly_<id>_*)
cd "$(dirname "$0")/.." || exit 1
id=$1
node dev/cut.js assets/raw/aot_hero_$id.png h_$id 48 down,left,right,up,fdown,fleft,fright,fup dev/out_test/h 4 || exit 1
for d in down left right up; do
  mv dev/out_test/h/h_${id}_${d}.png assets/sprites/hero_${id}_${d}.png
  mv dev/out_test/h/h_${id}_f${d}.png assets/sprites/herofly_${id}_${d}.png
done
echo "ok $id"
