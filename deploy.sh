#!/bin/bash
set -e  # Exit immediately if any command fails
# Step 1: Build your Next.js app
echo "Building the Next.js app..."
npm run build

# Step 2: Build the Docker image for Google Cloud Run
echo "Building Docker image..."
docker build -t gcr.io/$(gcloud config get-value project)/dotg .

# Step 3: Push the Docker image to Google Container Registry
echo "Pushing Docker image to Google Container Registry..."
docker push gcr.io/$(gcloud config get-value project)/dotg

# Step 4: Deploy to Google Cloud Run
echo "Deploying to Google Cloud Run..."
gcloud run deploy dotg \
  --image gcr.io/$(gcloud config get-value project)/dotg \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_UPLOADTHING_APP_ID=7dzxf2x6zw" \
  --set-env-vars "UPLOADTHING_SECRET=sk_live_51e673baa880ae4773e4d01a679a6aa073d96e12cdd9e66255f972a6bc3ba39d" \
  --set-env-vars "UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzUxZTY3M2JhYTg4MGFlNDc3M2U0ZDAxYTY3OWE2YWEwNzNkOTZlMTJjZGQ5ZTY2MjU1Zjk3MmE2YmMzYmEzOWQiLCJhcHBJZCI6IjdkenhmMng2enciLCJyZWdpb25zIjpbInNlYTEiXX0=" \

echo "Deployment complete!"
