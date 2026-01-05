#!/bin/bash

# Quick deploy script - use this if the IAM role already exists
# Usage: ./quick-deploy.sh [region]

REGION=${1:-us-west-1}
FUNCTION_NAME="refreshLeaderboard"
ROLE_NAME="EnforaLeaderboardLambdaRole"

echo "========================================="
echo "Quick Deploy: Leaderboard Lambda"
echo "Region: $REGION"
echo "========================================="
echo ""

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $ACCOUNT_ID"

# Check if role exists
echo "Checking if IAM role exists..."
aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: IAM role '$ROLE_NAME' not found!"
  echo "Please run ./setup-lambda.sh first to create the role"
  exit 1
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "Using role: $ROLE_ARN"
echo ""

# Deploy Lambda
echo "Deploying Lambda function..."
./deploy.sh $FUNCTION_NAME $REGION $ROLE_ARN

if [ $? -ne 0 ]; then
  echo ""
  echo "Deployment failed!"
  exit 1
fi

echo ""
echo "========================================="
echo "Checking EventBridge Setup..."
echo "========================================="
echo ""

# Check if EventBridge rule exists
aws events describe-rule --name refresh-leaderboard-schedule --region $REGION > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "EventBridge rule not found. Creating schedule..."

  # Create EventBridge rule
  aws events put-rule \
    --name refresh-leaderboard-schedule \
    --schedule-expression "cron(*/10 * * * ? *)" \
    --state ENABLED \
    --description "Refresh Enfora leaderboard cache every 10 minutes" \
    --region $REGION

  # Add Lambda as target
  LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

  aws events put-targets \
    --rule refresh-leaderboard-schedule \
    --targets "Id"="1","Arn"="${LAMBDA_ARN}" \
    --region $REGION

  # Grant EventBridge permission to invoke Lambda
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id AllowEventBridgeInvoke \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/refresh-leaderboard-schedule" \
    --region $REGION \
    2>&1 | grep -v "ResourceConflictException" || true

  echo "EventBridge schedule created"
else
  echo "EventBridge rule already exists"
fi

echo ""
echo "========================================="
echo "Testing Lambda Function..."
echo "========================================="
echo ""

# Invoke Lambda
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  response.json

if [ $? -eq 0 ]; then
  echo ""
  echo "Lambda Response:"
  cat response.json | python3 -m json.tool 2>/dev/null || cat response.json
  echo ""
  rm -f response.json
else
  echo "Lambda invocation failed!"
fi

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo "Schedule: Every 10 minutes"
echo ""
echo "Next steps:"
echo "1. Check CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252F${FUNCTION_NAME}"
echo "2. Verify cache: aws dynamodb get-item --table-name LeaderboardCache --key '{\"cacheType\": {\"S\": \"GLOBAL_TOP_100\"}}' --region ${REGION}"
echo "3. Test API: curl http://localhost:3000/api/leaderboard/top100"
echo ""
