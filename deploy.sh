#!/bin/bash

# Step 1: Build your Next.js app
echo "Building the Next.js app..."
npm run build

# Step 2: Build the Docker image for Google Cloud Run
echo "Building Docker image..."
docker build -t gcr.io/$(gcloud config get-value project)/my-next-app .

# Step 3: Push the Docker image to Google Container Registry
echo "Pushing Docker image to Google Container Registry..."
docker push gcr.io/$(gcloud config get-value project)/my-next-app

# Step 4: Deploy to Google Cloud Run
echo "Deploying to Google Cloud Run..."
gcloud run deploy my-next-app \
  --image gcr.io/$(gcloud config get-value project)/my-next-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

echo "Deployment complete!"
