#!/bin/bash

BUCKET_NAME="lel-riders-data-2025"
REGION="ap-south-1"

echo "Updating CORS configuration for S3 bucket: ${BUCKET_NAME}"

# Apply CORS configuration
aws s3api put-bucket-cors \
  --bucket ${BUCKET_NAME} \
  --cors-configuration file://s3-cors-config.json \
  --region ${REGION}

if [ $? -eq 0 ]; then
  echo "CORS configuration updated successfully!"
  
  # Verify the configuration
  echo -e "\nCurrent CORS configuration:"
  aws s3api get-bucket-cors --bucket ${BUCKET_NAME} --region ${REGION}
else
  echo "Failed to update CORS configuration"
  exit 1
fi