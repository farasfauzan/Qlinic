FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose frontend port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]
