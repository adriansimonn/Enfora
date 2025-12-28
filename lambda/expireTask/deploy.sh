#!/bin/bash

# Deploy the expireTask Lambda function
# Usage: ./deploy.sh

set -e

echo "📦 Installing dependencies..."
npm install --production

echo "🗜️  Creating deployment package..."
zip -r function.zip index.mjs node_modules/

echo "🚀 Deploying to AWS Lambda..."
aws lambda update-function-code \
  --function-name expireTask \
  --zip-file fileb://function.zip \
  --region us-west-1

echo "✅ Deployment complete!"
echo "🧹 Cleaning up..."
rm function.zip

echo "✨ Done!"
