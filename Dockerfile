# Use the latest official Node.js image
FROM node:latest

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
