#!/bin/bash

# S3 bucket name - using the same bucket as the existing riders.json
BUCKET_NAME="lel-riders-data-2025"
REGION="ap-south-1"

echo "Uploading JSON files to S3..."

# Upload routes.json
if [ -f "routes.json" ]; then
  echo "Uploading routes.json..."
  aws s3 cp routes.json s3://${BUCKET_NAME}/routes.json \
    --content-type "application/json" \
    --region ${REGION}
  echo "Routes URL: https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/routes.json"
else
  echo "routes.json not found!"
fi

# You can add more files here:
# aws s3 cp other.json s3://${BUCKET_NAME}/other.json --content-type "application/json" --acl public-read --region ${REGION}

echo "Upload complete!"