FROM node:20.18-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy hanya dependencies terlebih dahulu
COPY app/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy seluruh source code
COPY app .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3001

# Start App
CMD ["npm", "start"]
