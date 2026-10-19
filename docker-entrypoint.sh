#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 2

echo "Running database schema push..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "Initializing default data..."
node prisma/init-db.js

echo "Starting application..."
exec node server.js
