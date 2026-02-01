/**
 * Google Apps Script (GAS) 用の受信スクリプト例
 * 
 * 使い方:
 * 1. Googleスプレッドシートを開き、「拡張機能」 > 「Apps Script」を選択
 * 2. 下記のコードを貼り付ける
 * 3. 1行目のシート名を実際のシート名に合わせる
 * 4. 「デプロイ」 > 「新しいデプロイ」を選択
 * 5. 種類を「ウェブアプリ」にし、アクセスできるユーザーを「全員」に設定してデプロイ
 * 6. 発行されたURLを portal_converter.js の GAS_URL に設定する
 */

const SHEET_NAME = 'シート1'; // 実際のシート名に変更してください

function doPost(e) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // フォームデータの取得
    const number = e.parameter.number;
    const lesson = e.parameter.lesson;
    const summary = e.parameter.summary;
    const questions = e.parameter.questions;
    const timestamp = new Date(); // 日本時間で記録されます

    // スプレッドシートに追記
    // 列構成: A:タイムスタンプ, B:4桁番号, C:授業, D:まとめ, E:わからなかったところ
    sheet.appendRow([timestamp, number, lesson, summary, questions]);

    // レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
}
