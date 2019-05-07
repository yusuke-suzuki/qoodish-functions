# qoodish-functions

Cloud Functions for Qoodish

## Deploy

```
gcloud config set project <Project ID>

gcloud functions deploy generateThumbnail \
  --trigger-resource <Bucket Name> \
  --trigger-event google.storage.object.finalize \
  --runtime nodejs10 \
  --memory 512MB \
  --region asia-northeast1

gcloud functions deploy notifyFeedback \
  --trigger-event providers/cloud.firestore/eventTypes/document.create \
  --trigger-resource projects/<PROJECT_ID>/databases/default/documents/feedbacks/{feedbackId} \
  --runtime nodejs10 \
  --region asia-northeast1 \
  --env-vars-file .env.yaml
```
