@echo off
setlocal
set T=%TEMP%
cd /d D:\MyFiles\玩蜂\6python脚本\卡牌-全项目核心指标聚合
git fetch thinkpad wt/TRT_20 < NUL
if not exist C:\t\TRT_20 (git worktree add C:\t\TRT_20 thinkpad/wt/TRT_20 < NUL) else (cd /d C:\t\TRT_20 && git checkout -q --detach thinkpad/wt/TRT_20 < NUL)
cd /d C:\t\TRT_20
git rev-parse --short HEAD
cd /d C:\t\TRT_20\poc_core_kpi_web\poc_core_kpi_web_v2\frontend
if not exist node_modules mklink /J node_modules "D:\MyFiles\玩蜂\6python脚本\卡牌-全项目核心指标聚合\poc_core_kpi_web\poc_core_kpi_web_v2\frontend\node_modules"
call npx vitest run %* > %T%\trt20_test.out 2>&1
echo VITEST_EXIT=%ERRORLEVEL% >> %T%\trt20_test.out
type %T%\trt20_test.out
