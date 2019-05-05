# qoodish-functions

Cloud Functions for Qoodish

## Deploy

```
gcloud config set project <Project ID>

gcloud functions deploy generateThumbnail --trigger-resource <Bucket Name> --trigger-event google.storage.object.finalize --runtime nodejs10 --region asia-northeast1
```
