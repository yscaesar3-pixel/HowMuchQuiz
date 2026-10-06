# HowMuchQuiz 音声修正 + 範囲回答見直し 差分

`C:\dev\HowMuchQuiz` に、このZIPの内容をフォルダ構成を保ったまま上書きしてください。

## 変更内容

### 1. 音声
- BGMはWeb Audio APIのまま維持し、iOSロック画面に再生UIを残さない構成。
- Capacitor/WKWebViewでローカルMP3を安定して読めるよう、`fetch()` 依存から XHR(arraybuffer) 読み込みへ変更。
- ユーザー操作時にAudioContextを確実にresume。
- 効果音はWeb Audio再生失敗時のみHTMLAudioへフォールバック。
- 以下3ファイルが無い場合はCodemagicのPrepare web assetsで失敗するようチェック追加。
  - `www/audio/bgm_main.mp3`
  - `www/audio/se_tap.mp3`
  - `www/audio/se_answer.mp3`

※音源ファイル自体はこの差分ZIPには含めていません。既存プロジェクト内の音源をそのまま使用します。

### 2. 範囲回答
- 3000問すべてを走査。
- 範囲回答: 361問。
- `最大値 ÷ 最小値 >= 2.0` を「広すぎる範囲」と判定。
- 100問を修正。
- 中央値への機械置換はせず、元の範囲情報の上限を使い「多い場合」「大きい場合」「長い場合」等を問う形式へ変更。
- 261問の比較的狭い範囲は維持。
- 修正一覧は `RANGE_AUDIT.md` を参照。

## 上書きされるファイル
- `www/app.js`
- `www/questions_1.js`
- `www/questions_2.js`
- `www/questions_3.js`
- `scripts/prepare-www.mjs`

## 適用後
1. GitHub Desktopで変更を確認
2. Commit
3. Push
4. Codemagicでビルド
5. TestFlightでBGM / タップSE / 答えSEを確認
6. ロック画面にBGM再生コントロールが残らないことも確認
