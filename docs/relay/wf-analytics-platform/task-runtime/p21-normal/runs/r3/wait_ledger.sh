#!/bin/bash
# usage: wait_ledger.sh <plan_dir> <monitor_name> ; exits when stage_result line appears after current line count, or monitor idle>=120s with no new line
L=$1/relay_log.jsonl; M=$2; n0=$(wc -l <"$L"); idle=0; last=$n0
while true; do
  sleep 15; n=$(wc -l <"$L")
  if [ "$n" -gt "$last" ]; then
    if sed -n "$((last+1)),${n}p" "$L" | grep -q '"event":"stage_result"'; then echo "STAGE_RESULT"; sed -n "$((n0+1)),${n}p" "$L" | tail -3; exit 0; fi
    last=$n; idle=0; continue
  fi
  st=$(herdr agent get "$M" 2>/dev/null | grep -o '"agent_status":"[a-z]*"' | head -1)
  if echo "$st" | grep -qv working; then idle=$((idle+15)); else idle=0; fi
  if [ $idle -ge 120 ]; then echo "MONITOR_IDLE status=$st lines=$n"; exit 0; fi
done
