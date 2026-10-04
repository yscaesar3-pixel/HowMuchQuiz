# どのくらい？ - 予想！数字クイズ

iPhone向けの数字雑学クイズアプリ `HowMuchQuiz` のプロジェクトです。

## アプリ情報
- Bundle ID: `com.yutaXXX.howmuchquiz`
- 問題数: 1500問
- AdMob App ID: `ca-app-pub-8174756915786797~5894309090`
- Banner: `ca-app-pub-8174756915786797/3736807205`
- Interstitial: `ca-app-pub-8174756915786797/9626418978`

## 開発・配布フロー
1. `C:\dev\HowMuchQuiz` をGitHub Desktopで管理
2. 変更をCommit / Push
3. Codemagicの `ios-release` workflowを実行
4. Codemagic側でCapacitor iOSプロジェクトを生成
5. App Store用署名でIPAを作成
6. App Store Connectへアップロード
7. 動作確認後、そのままリリース可能

## 音源
`www/audio/` に以下を配置します。

- `bgm_main.mp3`
- `se_tap.mp3`
- `se_answer.mp3`

詳細は `AUDIO_SETUP.md` を参照してください。

## 広告
- HOME / CATEGORY / QUIZ / FAVORITES: バナー広告
- SETTINGS: バナー非表示
- 18〜22問ごとに「次の問題」を押したタイミングでインタースティシャル
- 広告が利用できない場合もクイズ進行は停止しない
- UMPによる同意管理
