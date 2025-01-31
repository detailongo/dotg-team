#!/bin/bash
set -e  # Exit immediately if any command fails

# Step 1: Build Next.js
echo "Building the DOTG app..."
npm run build

# Step 2: Build Docker image (point to Artifact Registry)
echo "Building Docker image..."
docker build -t us-central1-docker.pkg.dev/$(gcloud config get-value project)/dotg/dotg:latest .

# Step 3: Push Docker image
echo "Pushing Docker image to Artifact Registry..."
docker push us-central1-docker.pkg.dev/$(gcloud config get-value project)/dotg/dotg:latest

# Step 4: Deploy to Cloud Run
echo "Deploying to Google Cloud Run..."
gcloud run deploy dotg \
  --image us-central1-docker.pkg.dev/$(gcloud config get-value project)/dotg/dotg:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_UPLOADTHING_APP_ID=7dzxf2x6zw" \
  --set-env-vars "UPLOADTHING_SECRET=sk_live_51e673baa880ae4773e4d01a679a6aa073d96e12cdd9e66255f972a6bc3ba39d" \
  --set-env-vars "UPLOADTHING_TOKEN=eyJhcGlLZXkiOiJza19saXZlXzUxZTY3M2JhYTg4MGFlNDc3M2U0ZDAxYTY3OWE2YWEwNzNkOTZlMTJjZGQ5ZTY2MjU1Zjk3MmE2YmMzYmEzOWQiLCJhcHBJZCI6IjdkenhmMng2enciLCJyZWdpb25zIjpbInNlYTEiXX0="

echo "Deployment complete!"