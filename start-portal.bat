@echo off
chcp 65001 > nul
echo ========================================
echo   ポータル起動スクリプト
echo ========================================
echo.

cd /d "%~dp0"

echo 📚 授業記録を最新化しています...
echo.

node note\scripts\convert.js

echo.
echo ========================================
echo   処理が完了しました！ポータルを開きます。
echo ========================================
echo.

start index.html
exit
