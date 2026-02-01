@echo off
chcp 65001 > nul
echo ========================================
echo   授業記録の更新スクリプト
echo ========================================
echo.

cd /d "%~dp0"

echo 📚 Markdownファイルを変換しています...
echo.

node note\scripts\convert.js

echo.
echo ========================================
echo   処理が完了しました！
echo ========================================
echo.
echo ブラウザでポータルを開いて確認してください。
echo.
pause
