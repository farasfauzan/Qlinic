FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy configuration and source files
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
