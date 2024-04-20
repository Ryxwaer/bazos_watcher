# Stage 1: Build the application
FROM node:16-alpine as builder

# Set the working directory
WORKDIR /usr/src/app

ARG DB_URI
ARG EMAIL_USER
ARG EMAIL_PASS

# Set environment variables
ENV DB_URI=${DB_URI} \
    EMAIL_USER=${EMAIL_USER} \
    EMAIL_PASS=${EMAIL_PASS}

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including 'devDependencies' for building the app
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Setup the production environment
FROM node:16-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy built assets from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy package.json and package-lock.json
COPY --from=builder /usr/src/app/package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]