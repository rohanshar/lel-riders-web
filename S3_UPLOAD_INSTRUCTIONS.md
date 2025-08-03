# S3 Upload Instructions

## Prerequisites
- AWS CLI configured with appropriate credentials
- Access to the `lel-riders-data-2025` S3 bucket

## Steps to Fix CORS and Upload Files

1. **First, update CORS configuration**:
   ```bash
   ./update-s3-cors.sh
   ```

2. **Then upload routes.json**:
   ```bash
   ./upload-to-s3.sh
   ```

2. **To upload additional JSON files**, add them to the script:
   Edit `upload-to-s3.sh` and add lines like:
   ```bash
   aws s3 cp your-file.json s3://lel-riders-data-2025/your-file.json \
     --content-type "application/json" \
     --acl public-read \
     --region ap-south-1
   ```

## Files Currently in Use
- `riders.json` - Main rider data (already exists)
- `routes.json` - Route coordinates and checkpoints (new)

## Public URLs
- Riders: https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/riders.json
- Routes: https://lel-riders-data-2025.s3.ap-south-1.amazonaws.com/routes.json

## To Delete Later
All files are in the same bucket (`lel-riders-data-2025`), making it easy to manage or delete them together.