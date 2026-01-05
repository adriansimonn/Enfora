#!/bin/bash

# Deploy script for refreshLeaderboard Lambda function
# Usage: ./deploy.sh [function-name] [region] [role-arn]

FUNCTION_NAME=${1:-refreshLeaderboard}
REGION=${2:-us-west-1}
ROLE_ARN=${3}

echo "Deploying Lambda function: $FUNCTION_NAME to region: $REGION"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create deployment package
echo "Creating deployment package..."
zip -r function.zip index.mjs node_modules package.json

# Check if Lambda function exists
echo "Checking if Lambda function exists..."
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1

if [ $? -eq 0 ]; then
  # Function exists, update it
  echo "Function exists. Updating function code..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

  if [ $? -eq 0 ]; then
    echo "Lambda function updated successfully!"
  else
    echo "Update failed!"
    rm function.zip
    exit 1
  fi
else
  # Function doesn't exist, create it
  echo "Function doesn't exist. Creating new function..."

  if [ -z "$ROLE_ARN" ]; then
    echo "ERROR: Role ARN is required for creating a new Lambda function."
    echo "Usage: ./deploy.sh $FUNCTION_NAME $REGION <role-arn>"
    echo ""
    echo "Please provide the IAM role ARN with DynamoDB permissions."
    echo "Example: arn:aws:iam::585768181436:role/lambda-dynamodb-role"
    rm function.zip
    exit 1
  fi

  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs20.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 300 \
    --memory-size 512 \
    --region $REGION

  if [ $? -eq 0 ]; then
    echo "Lambda function created successfully!"
  else
    echo "Creation failed!"
    rm function.zip
    exit 1
  fi
fi

# Clean up
rm function.zip
echo "Deployment package cleaned up."
