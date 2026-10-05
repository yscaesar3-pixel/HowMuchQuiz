# HowMuchQuiz 差分適用

現在の `C:\dev\HowMuchQuiz` に、このZIPの内容をフォルダ構成を保ったまま上書きしてください。

## 変更ファイル
- `package.json`
- `scripts/prepare-www.mjs`
- `www/app.js`
- `www/index.html`
- `www/style.css`

## 追加ファイル（すべてWebP）
- `www/images/home_bg.webp`
- `www/images/category_bg.webp`
- `www/images/quiz_bg.webp`
- `www/images/answer_bg.webp`
- `www/images/settings_bg.webp`

## 今回の修正
- iPhoneで連続操作後に画面が拡大し、縦横スクロール可能になる症状への対策
  - viewport固定
  - `touch-action: manipulation`
  - overscroll抑制
  - 答えバウンスの拡大量を縮小
- 振動をWeb API依存から `@capacitor/haptics` に変更
  - 答え表示時にMedium haptic
  - 設定で振動をONにした直後にLight hapticで確認可能
  - Web版では対応端末のみ `navigator.vibrate` にフォールバック
- クイズ画面右上に設定ボタンを追加
  - クイズ中に設定を開き、戻ると同じクイズ画面へ復帰
- 画面背景を追加して見た目を強化
  - ホーム / カテゴリ / クイズ / 答え / 設定で個別背景
  - 文字の読みやすさを保つ半透明レイヤー・カードを追加
- 3000問構成は変更なし

## ビルド
追加操作は不要です。Codemagicの既存フローで `npm install` → Capacitor sync が実行されるため、Hapticsプラグインも組み込まれます。

GitHub DesktopでCommit → Push → Codemagic → TestFlightで確認してください。
