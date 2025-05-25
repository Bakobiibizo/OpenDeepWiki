#!/bin/sh
set -x

source .env

# Set default API URL
DEFAULT_API_URL="http://localhost:5085"
API_URL="${API_URL:-$DEFAULT_API_URL}"

echo "Starting application with API_URL: $API_URL"
echo "Replacing API URL placeholder with: $API_URL"
    
# Replace placeholder in all JavaScript files in .next directory
find /app/.next -name "*.js" -type f -exec sed -i "s|http://__API_URL_PLACEHOLDER__|$API_URL|g" {} \;
find /app/.next -name "*.json" -type f -exec sed -i "s|http://__API_URL_PLACEHOLDER__|$API_URL|g" {} \;
    
# Replace placeholder in server-side rendering files
find /app -name "server.js" -type f -exec sed -i "s|http://__API_URL_PLACEHOLDER__|$API_URL|g" {} \;
    
# Create client-side runtime configuration
cat > /app/public/runtime-config.js << EOF
window.__API_URL__ = '$API_URL';
EOF
    
echo "API URL replacement completed"

# Start Next.js application
echo "Starting Next.js server..."
exec node server.js