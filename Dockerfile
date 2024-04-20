# Step 1: Use a node base image
FROM node:16-alpine as builder

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock if you use yarn)
COPY package*.json ./

# Install dependencies including 'devDependencies' required for building the app
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the application
RUN npm run build

# Step 2: Prepare production image
FROM node:16-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the builder stage
COPY --from=builder /usr/src/app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Use arguments to set environment variables
ARG DB_URI
ARG EMAIL_USER
ARG EMAIL_PASS

# Set environment variables
ENV DB_URI=${DB_URI} \
    EMAIL_USER=${EMAIL_USER} \
    EMAIL_PASS=${EMAIL_PASS}

# Expose port 3000
EXPOSE 3000

# Command to run your app using Node.js
CMD ["node", "dist/main"]
