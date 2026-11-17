#!/bin/bash
# Deploy Nyay Saathi to Google Cloud Run.
#
#   PROJECT=my-project bash deploy/cloudrun-deploy.sh setup    # once: APIs, service account, IAM
#   PROJECT=my-project bash deploy/cloudrun-deploy.sh deploy   # build with Cloud Build and deploy
#
# Architecture: Cloud Build builds the Dockerfile from source and stores the image in Artifact
# Registry; Cloud Run serves it (scales to zero); Firestore keeps the privacy-first impact events;
# Gemini (OpenAI-compatible endpoint) runs the agent's tool calls; Secret Manager holds the Gemini
# key and the analytics salt. Before running `deploy`, create two secrets (values never go in git):
#   printf '%s' "<key from aistudio.google.com>" | gcloud secrets create gemini-api-key --data-file=- --project "$PROJECT"
#   openssl rand -hex 16 | tr -d '\n' | gcloud secrets create analytics-salt --data-file=- --project "$PROJECT"
# (To keep visitor counts continuous with an existing server, use that server's data/.analytics-salt.)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${PROJECT:?set PROJECT to your Google Cloud project id}"
REGION=${REGION:-asia-south1}
SERVICE=${SERVICE:-nyay-saathi}
MODEL=${MODEL:-gemini-3.5-flash}
SA="$SERVICE-run@$PROJECT.iam.gserviceaccount.com"
g() { gcloud --project "$PROJECT" "$@"; }

case "${1:-}" in
  setup)
    g services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
      firestore.googleapis.com secretmanager.googleapis.com
    g iam service-accounts describe "$SA" >/dev/null 2>&1 || \
      g iam service-accounts create "$SERVICE-run" --display-name "Nyay Saathi on Cloud Run"
    # Least privilege: read/write Firestore documents, read the two secrets. Nothing else.
    g projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:$SA" --role roles/datastore.user --condition None >/dev/null
    for s in gemini-api-key analytics-salt; do
      g secrets add-iam-policy-binding "$s" --member "serviceAccount:$SA" --role roles/secretmanager.secretAccessor >/dev/null
    done
    echo "setup done for $PROJECT (service account $SA)"
    ;;
  deploy)
    SHA=$(git rev-parse --short=8 HEAD)
    g run deploy "$SERVICE" --source . --region "$REGION" \
      --service-account "$SA" --allow-unauthenticated \
      --min-instances 0 --max-instances 1 --concurrency 80 --memory 256Mi --cpu 1 --timeout 60 \
      --set-env-vars "ANALYTICS_STORE=firestore,TRUST_PROXY=1,LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai,LLM_MODEL=$MODEL,LLM_TIMEOUT_MS=30000,REVISION=$SHA" \
      --set-secrets "LLM_API_KEY=gemini-api-key:latest,ANALYTICS_SALT=analytics-salt:latest" \
      --labels "app=nyay-saathi"
    URL=$(g run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)')
    for i in $(seq 1 20); do
      [ "$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$URL/healthz")" = "200" ] && { echo "up: $SHA at $URL"; curl -s "$URL/healthz"; echo; exit 0; }
      sleep 3
    done
    echo "not answering at $URL/healthz"; exit 1
    ;;
  *) echo "usage: PROJECT=<id> bash deploy/cloudrun-deploy.sh setup|deploy"; exit 2 ;;
esac
