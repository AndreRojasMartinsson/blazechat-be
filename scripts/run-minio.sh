#!/bin/bash

set -euo pipefail

# Load .env into this shell
set -o allexport
source "$(dirname "$0")/../.env"
set +o allexport

mkdir -p ~/minio/data

docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name blazechat_minio \
  -v ~/minio/data:/data \
  -e "MINIO_ROOT_USER=blazechat" \
  -e "MINIO_ROOT_PASSWORD=9s8IrAWlH2qz5rAe8q" \
  quay.io/minio/minio server /data --console-address ":9001" 
