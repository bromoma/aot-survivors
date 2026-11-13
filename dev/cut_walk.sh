#!/bin/bash
# usage: dev/cut_walk.sh <type>  (assets/raw/aot_titan_<type>_walk.png -> titan_<type>_<h>_walk<i>_<dir>)
cd "$(dirname "$0")/.." || exit 1
t=$1
for h in 110 140 170 200; do
  node dev/cut.js assets/raw/aot_titan_${t}_walk.png w_${t}_$h $h d0,d1,d2,l0,l1,l2,u0,u1,u2 dev/out_test/w 9 | cut -c1-80 || exit 1
  for i in 0 1 2; do
    mv dev/out_test/w/w_${t}_${h}_d$i.png assets/sprites/titan_${t}_${h}_walk${i}_down.png
    mv dev/out_test/w/w_${t}_${h}_l$i.png assets/sprites/titan_${t}_${h}_walk${i}_left.png
    mv dev/out_test/w/w_${t}_${h}_u$i.png assets/sprites/titan_${t}_${h}_walk${i}_up.png
  done
done
echo "ok $t"
