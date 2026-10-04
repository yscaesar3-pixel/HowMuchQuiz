# どのくらい？ - 予想！数字クイズ / TestFlight 1500問版 v0.3

## 登録情報
- Bundle ID: `com.yutaXXX.howmuchquiz`
- AdMob App ID: `ca-app-pub-8174756915786797~5894309090`
- Banner: `ca-app-pub-8174756915786797/3736807205`
- Interstitial: `ca-app-pub-8174756915786797/9626418978`
- Codemagic provisioning profile reference: `howmuchquiz-appstore`（Codemagicへアップロード済み）
- App Store Connect integration: `oddiro_asc_key`（既存環境を使用）

## GitHub Desktop → Codemagic → TestFlight
1. このZIPを展開する。
2. 展開したフォルダをGitHub Desktopの対象リポジトリへ配置する（新規リポジトリならこのフォルダをそのまま使用）。
3. Commit → Push。
4. Codemagicで `ios-testflight` workflowを実行。
5. CodemagicがiOSプロジェクトを新規生成し、AdMob設定・iPhoneのみ・アプリアイコンを自動設定。
6. App Store用署名でIPAを作成し、TestFlightへ自動送信。

## 広告仕様
- HOME / CATEGORY / QUIZ / FAVORITES: バナー広告
- SETTINGS: バナー非表示
- 答えを表示した回数をカウントし、18〜22問ごとに「次の問題」を押したタイミングでインタースティシャル
- 広告がロードできていない場合はゲーム進行を止めない
- UMP同意情報を取得し、必要な地域では同意フォームを表示
- 設定画面に「広告のプライバシー設定」ボタンを追加
- TestFlight版は指定された本番AdMob IDを使用（`testMode: false`）

## 1500問
- `www/questions.js` に1500問を収録
- 今回はまず実機動作確認用。新規候補の最終出典確認はApp Store正式提出前に行う。
