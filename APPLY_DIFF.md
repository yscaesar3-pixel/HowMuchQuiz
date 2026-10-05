# HowMuchQuiz 差分適用手順

対象: 現在の3000問版 HowMuchQuiz

1. このZIPの中身を `C:\dev\HowMuchQuiz` へフォルダ構成を保ったまま上書きしてください。
2. GitHub Desktopで変更を確認し、Commit → Pushしてください。
3. Codemagicでビルドし、TestFlightで確認してください。

## 変更内容
- BGM/効果音をWeb Audio API方式へ変更。iOSロック画面のメディア再生UIを残さない構成。
- BGMのループ、BGM ON/OFF、バックグラウンド停止、復帰時再開は維持。
- 12カテゴリを専用WebPアイコンへ変更。

## 追加画像
- www/images/category_human.webp
- www/images/category_animal.webp
- www/images/category_life.webp
- www/images/category_food.webp
- www/images/category_earth.webp
- www/images/category_science.webp
- www/images/category_space.webp
- www/images/category_japan.webp
- www/images/category_world.webp
- www/images/category_transport.webp
- www/images/category_sports.webp
- www/images/category_history.webp

既存の3000問データ、Haptics、背景画像、広告設定は変更しません。
