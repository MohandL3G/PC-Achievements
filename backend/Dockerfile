FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Environment variables will be passed through docker-compose
EXPOSE 5000

CMD ["npm", "start"]
