# **丸わかり！生成 AI アプリケーション開発パターン**

## **ハンズオン概要**

本ハンズオンでは Google Cloud のマネージドサービスをフル活用し、生成 AI を組み込んだ実際に動作する複数のアプリケーションを構築、デプロイします。このハンズオンだけで生成 AI アプリのトレンドを掴んで頂けるように、最新のユースケースを幅広くカバーします。生成 AI を実際のアプリケーションに組み込む場合のプラクティスについて興味がある方、Google Cloud + 生成 AI でどのようなことができるのかを網羅的に体験したい方におすすめです。

以下が今回のハンズオンで利用する主要なサービスです。

**Cloud Run**

- Dockerfile、ソースコードから 1 コマンドで Cloud Run にデプロイ
- プライベートリリース (タグをつけたリリース) などのトラフィック コントロール
- 複数のサービスを Cloud Run で動かし連携させる

**Firebase**

- 認証 (Firebase Authentication)
- NoSQL データベース (Firestore)
- オブジェクトストレージ (Cloud Storage for Firebase)

**Vertex AI**

- 生成 AI の API (Gemini 1.5 Flash)
- RAG 機能を司る API 群 (LlamaIndex on Vertex AI for RAG)

今回は以下の 2 つのアプリケーションを構築していくことで、Google Cloud を使った生成 AI のアプリケーション組み込みを学びます。

- UI、または UI に関わるフロントエンド機能を提供するアプリケーション (AI organizer)
- 生成 AI 機能を担当するバックエンドアプリケーション (GenAI backend)

## **Google Cloud プロジェクトの確認**

開いている Cloud Shell のプロンプトに `(黄色の文字)` の形式でプロジェクト ID が表示されていることを確認してください。

これが表示されている場合は、Google Cloud のプロジェクトが正しく認識されています。

表示されていない場合は、以下の手順で Cloud Shell を開き直して下さい

1. Cloud Shell を閉じる
1. 上のメニューバーのプロジェクト選択部分で払い出されたプロジェクトが選択されていることを確認する。
1. Cloud Shell を再度開く

## **参考: Cloud Shell の接続が途切れてしまったときは?**

一定時間非アクティブ状態になる、またはブラウザが固まってしまったなどで `Cloud Shell` の接続が切れてしまう場合があります。

その場合は `再接続` をクリックした後、以下の対応を行い、チュートリアルを再開してください。

![再接続画面](https://raw.githubusercontent.com/GoogleCloudPlatform/gcp-getting-started-lab-jp/master/workstations_with_generative_ai/images/reconnect_cloudshell.png)

### **1. チュートリアル資材があるディレクトリに移動する**

```bash
cd ~/next-tokyo-assets/2024/genai_application_development_patterns
```

### **2. チュートリアルを開く**

```bash
teachme tutorial_ja.md
```

途中まで進めていたチュートリアルのページまで `Next` ボタンを押し、進めてください。

## **環境準備**

<walkthrough-tutorial-duration duration=10></walkthrough-tutorial-duration>

最初に、ハンズオンを進めるための環境準備を行います。

下記の設定を進めていきます。

- Google Cloud 機能（API）有効化設定

## **Google Cloud 環境設定**

Google Cloud では利用したい機能（API）ごとに、有効化を行う必要があります。

ここで、以降のハンズオンで利用する機能を事前に有効化しておきます。

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  eventarc.googleapis.com \
  aiplatform.googleapis.com \
  translate.googleapis.com \
  firebasestorage.googleapis.com
```

**GUI**: [API ライブラリ](https://console.cloud.google.com/apis/library)

<walkthrough-footnote>必要な機能が使えるようになりました。次に Firebase の設定方法を学びます。</walkthrough-footnote>

## **Firebase プロジェクトの設定**

AI organizer では、ユーザー情報は [Firebase Authentication](https://firebase.google.com/docs/auth)、アプリケーションのメタデータは [Cloud Firestore](https://firebase.google.com/docs/firestore)、 そしてファイルの格納場所として [Cloud Storage for Firebase](https://firebase.google.com/docs/storage) を活用します。Firebase の機能を活用することで、リアルタイム性の高い Web アプリケーションを開発することができます。

### **1. Firebase プロジェクトの有効化**

**GUI** から Firebase を有効化します。

1. [Firebase コンソール](https://console.firebase.google.com/) にブラウザからアクセスします。
1. `プロジェクトを作成` ボタンをクリックします。
1. 最下部の `Cloud プロジェクトに Firebase を追加` をクリックします。
1. `Google Cloud プロジェクトを選択する` から qwiklabs で利用しているプロジェクトを選択します。
1. 規約への同意、利用目的のチェックマークを入れ、`続行` をクリックします。

   料金確認画面が表示された場合は、`プランを確認` ボタンをクリックします。

1. Google Cloud プロジェクトに Firebase を追加する際に注意すべき点

   `続行` をクリックします。

1. Google アナリティクス（Firebase プロジェクト向け）

   `このプロジェクトで Google アナリティクスを有効にする` をオフにし、`Firebase を追加` をクリックします。

1. `Firebase プロジェクトが準備できました` と表示されたら `続行` をクリックします。

### **2. Terraform の初期化**

本ハンズオンではいくつかの設定を作成済みの Terraform スクリプトを利用します。

そのために Terraform 実行環境を初期化します。

```bash
(cd tf/ && terraform init)
```

```bash
(cd tf/; terraform init && terraform apply -var="project_id=$GOOGLE_CLOUD_PROJECT")
```

コマンドを実行した場合は **ステップ 12** に進んでください。

## **Firebase アプリケーションの設定**

### **1. Firebase アプリケーションの作成**

**CLI** から実行します。

```bash
firebase apps:create -P $GOOGLE_CLOUD_PROJECT WEB ai-organizer
```

### **2. Firebase 設定のアプリケーションへの埋め込み**

```bash
./scripts/firebase_config.sh ./src/ai-organizer
```

全ての NEXT_PUBLIC_FIREBASE_XXXX という出力の右辺 (=より後ろ) に、文字列が設定されていれば成功です。

## **Firebase Authentication の設定**

```bash
(cd tf/ && terraform apply -target=google_identity_platform_config.default -var="project_id=$GOOGLE_CLOUD_PROJECT" -auto-approve)
```

## **Firestore データベース、セキュリティルールの設定**

```bash
(cd tf/ && terraform apply -target=google_firestore_database.default -target=google_firebaserules_ruleset.firestore -target=google_firebaserules_release.firestore -var="project_id=$GOOGLE_CLOUD_PROJECT" -auto-approve)
```

## **Cloud Storage for Firebase、セキュリティルールの設定**

```bash
(cd tf/ && terraform apply -target=google_app_engine_application.default -target=google_firebase_storage_bucket.default -target=google_firebaserules_ruleset.storage -target=google_firebaserules_release.storage -var="project_id=$GOOGLE_CLOUD_PROJECT" -auto-approve)
```

## **AI organizer をデプロイするための事前設定**

Cloud Run では様々な方法でデプロイが可能です。ここでは以下の方法でアプリケーションをデプロイします。

- Dockerfile を利用して、ソースファイルから 1 コマンドで Cloud Run にデプロイ

### **1. サービスアカウントの作成**

デフォルトでは Cloud Run にデプロイされたアプリケーションは強い権限を持ちます。最小権限の原則に従い、必要最小限の権限を持たせるため、まずサービス用のアカウントを作成します。

```bash
gcloud iam service-accounts create ai-organizer-sa
```

### **2. サービスアカウントへの権限追加**

AI organizer は認証情報の操作、Firestore の読み書き権限が必要です。先程作成したサービスアカウントに権限を付与します。

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:ai-organizer-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role 'roles/firebaseauth.admin'
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:ai-organizer-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role 'roles/iam.serviceAccountTokenCreator'
```

## **AI organizer のデプロイ**

Cloud Build でコンテナイメージを作成、作成したイメージを Cloud Run にデプロイします。

```bash
gcloud run deploy ai-organizer \
  --source ./src/ai-organizer \
  --service-account ai-organizer-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --region asia-northeast1 \
  --quiet
```

**注**: デプロイ完了まで 5 分程度かかります。

## **AI organizer の試用**

### **1. アプリケーションへブラウザからアクセス**

前のコマンドで出力された `Service URL` or `Service_URL` から URL をクリックすると、ブラウザのタブが開きチャットアプリケーションが起動します。

### **2. 新規ユーザーの登録**

最下部の `アカウントを登録する` をクリックし、ユーザー情報を入力、`登録 / Register` をクリックします。

うまく登録ができると、ファイル管理画面に遷移します。

### **3. 色々な機能の試用**

- `新規` ボタンから新しいフォルダの作成、ローカルにあるファイルのアップロードが可能です。
- 右上の `アバター` マークをクリックするとログアウトが可能です。
- 上部の検索バーから、ファイル名、フォルダ名の検索が可能です。完全一致検索となっていることに注意してください。
- フォルダは階層化でき、ファイルはアップロード後クリックすると、別のタブで表示することができます。

### **4. 別アカウントでの動作を確認**

一度ログアウトし、別のアカウントを作成してサインインしてみましょう。

先に作成したアカウントとはファイル、フォルダが分離されていることがわかります。

## **生成 AI を活用しアップロード済みファイルをベースにした回答生成機能 (GenAI App) の追加**

AI organizer に、生成 AI を活用し質問文への回答を返す機能である GenAI App を追加します。

今回は、GenAI App も個別の Cloud Run サービスでデプロイし、2 つのサービスを連携させるようにします。

## **GenAI App のデプロイ**

GenAI App もコンテナで Cloud Run で稼働させます。このアプリケーションは大きく以下の 2 つの機能を持っています。

- PDF ファイルが Cloud Storage に置かれると、それをトリガーにファイルの取得、Embedding の生成、データベースへの格納
- 質問文を受け取り、回答を生成して返す

### **1. サービスアカウントの作成**

このサービス用のアカウントを作成します。

```bash
gcloud iam service-accounts create genai-app
```

### **2. サービスアカウントへの権限追加**

生成 AI 処理アプリケーションは Cloud SQL、Vertex AI などのサービスへのアクセス権限が必要です。

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/cloudsql.client
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/aiplatform.user
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/storage.objectUser
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member=serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role=roles/eventarc.eventReceiver
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member serviceAccount:genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role roles/datastore.user
```

### **3 GenAI App のビルド、デプロイ**

```bash
gcloud builds submit ./src/genai-app \
  --tag asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/ai-organizer-repo/genai-app && \
gcloud run deploy genai-app \
  --image asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/ai-organizer-repo/genai-app \
  --service-account genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --no-allow-unauthenticated \
  --set-env-vars "PJID=$GOOGLE_CLOUD_PROJECT" \
  --region asia-northeast1
```

## **Eventarc の設定**

ユーザーがファイルをアップロードしたときに生成 AI アプリを呼び出すように、Eventarc の設定を行います。

### **1. 前準備**

```bash
SERVICE_ACCOUNT="$(gsutil kms serviceaccount -p $GOOGLE_CLOUD_PROJECT)"
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role='roles/pubsub.publisher'
gcloud run services add-iam-policy-binding genai-app \
  --member="serviceAccount:genai-app@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
  --role='roles/run.invoker' \
  --region asia-northeast1
```

### **2. Eventarc トリガーの作成**

```bash
gcloud eventarc triggers create genai-app \
  --destination-run-service=genai-app \
  --destination-run-region=asia-northeast1 \
  --location=asia-northeast1 \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=$GOOGLE_CLOUD_PROJECT.appspot.com" \
  --service-account=genai-app@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --destination-run-path=/register_doc
```

以下のようなエラーが出た場合は、数分待ってから再度コマンドを実行してください。

```
ERROR: (gcloud.eventarc.triggers.create) FAILED_PRECONDITION: Invalid resource state for "": Permission denied while using the Eventarc Service Agent.
```

## **非同期連携の設定**

今の非同期連携では以下の 2 つの問題があります。

- PDF ファイルの処理が 10 秒以内に終わらないと、エラー扱いになりリトライしてしまう
- リトライ回数に制限がなく、PDF ファイルの処理に失敗するとリトライされ続けてしまう＝リソースコストが上がり続けてしまう

これを解決するために以下の設定を行います。

- PDF ファイルの処理待ち時間を 300 秒 (5 分) に修正
- 合計 5 回同じファイルの処理に失敗したら、リトライをやめる (デッドレタートピックに入れる)

### **1. デッドレタートピックの作成**

```bash
gcloud pubsub topics create genai-app-dead-letter
```

### **2. デッドレタートピック関連の権限設定**

```bash
PROJECT_NUMBER=$(gcloud projects describe $GOOGLE_CLOUD_PROJECT --format="value(projectNumber)")
SUBSCRIPTION=$(gcloud pubsub subscriptions list --format json | jq -r '.[].name')
gcloud pubsub topics add-iam-policy-binding genai-app-dead-letter \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"
gcloud pubsub subscriptions add-iam-policy-binding $SUBSCRIPTION \
  --member="serviceAccount:service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

### **3. デッドレタートピックの設定、サブスクリプションの確認応答時間の修正**

```bash
SUBSCRIPTION=$(gcloud pubsub subscriptions list --format json | jq -r '.[].name')
gcloud pubsub subscriptions update $SUBSCRIPTION \
  --ack-deadline 300 \
  --dead-letter-topic genai-app-dead-letter
```

## **AI organizer の更新**

### **1. GenAI App API を呼び出す権限を付与**

```bash
gcloud run services add-iam-policy-binding genai-app \
  --member=serviceAccount:ai-organizer@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --role=roles/run.invoker \
  --region asia-northeast1
```

### **2. GenAI App との連携機能追加**

GenAI App と連携するために、AI organizer を更新します。

```bash
git switch genai-app-integration
```

### **3. 連携機能のデプロイ**

```bash
GENAI_APP_URL=$(gcloud run services describe genai-app --region asia-northeast1 --format json | jq -r '.status.url')
gcloud builds submit ./src/ai-organizer \
  --tag asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/ai-organizer-repo/ai-organizer && \
gcloud run deploy ai-organizer \
  --image asia-northeast1-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/ai-organizer-repo/ai-organizer \
  --service-account ai-organizer@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars "SEARCH_HOST=$GENAI_APP_URL" \
  --region asia-northeast1
```

## **連携機能の確認**

### **1. ファイルのアップロード**

GenAI App は PDF ファイルを読み取り、処理します。

以下の中から学習させてみたい PDF をローカル PC にダウンロードし、AI organizer からアップロードしてください。

- [Cloud Run](https://storage.googleapis.com/genai-handson-20230929/CloudRun.pdf)
- [Cloud SQL](https://storage.googleapis.com/genai-handson-20230929/CloudSQL.pdf)
- [Cloud Storage for Firebase](https://storage.googleapis.com/genai-handson-20230929/CloudStorageforFirebase.pdf)
- [Firebase Authentication](https://storage.googleapis.com/genai-handson-20230929/FirebaseAuthentication.pdf)
- [Firestore](https://storage.googleapis.com/genai-handson-20230929/Firestore.pdf)
- [Palm API と LangChain の連携](https://storage.googleapis.com/genai-handson-20230929/PalmAPIAndLangChain.pdf)

### **2. GenAI App への質問**

上部検索バー上の右の方のアイコンをクリックすると、ファイル/フォルダ名検索と GenAI App への質問機能を切り替えられるようになっています。

GenAI App への質問に切り替え、先程アップロードしたファイルの情報に関連する質問を投げてみましょう。

無事、回答が返ってくれば成功です。

### **3. 色々試してみる**

様々な PDF をアップロードして回答がどのように変わるか試してみましょう。

## **Congraturations!**

<walkthrough-conclusion-trophy></walkthrough-conclusion-trophy>

これにて生成 AI を用いたアプリケーション開発ハンズオンが完了です。

Qwiklabs に戻り、`ラボを終了` ボタンをクリックし、ハンズオンを終了します。
