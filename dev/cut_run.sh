#!/bin/bash
# usage: dev/cut_run.sh <man|woman>  (assets/raw/aot_civ_<who>_run.png -> civ_<who>_run<i>_<dir>)
cd "$(dirname "$0")/.." || exit 1
w=$1
node dev/cut.js assets/raw/aot_civ_${w}_run.png r_$w 42 d0,d1,d2,l0,l1,l2,u0,u1,u2 dev/out_test/w 9 | cut -c1-80 || exit 1
for i in 0 1 2; do
  mv dev/out_test/w/r_${w}_d$i.png assets/sprites/civ_${w}_run${i}_down.png
  mv dev/out_test/w/r_${w}_l$i.png assets/sprites/civ_${w}_run${i}_left.png
  mv dev/out_test/w/r_${w}_u$i.png assets/sprites/civ_${w}_run${i}_up.png
done
echo "ok $w"
