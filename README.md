DEPLOY: 

# 1. Submit build WITH source files
gcloud builds submit --config=cloudbuild.yaml

# 2. Grant public access if not done
gcloud run services add-iam-policy-binding dotg \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker