# Stage 1: Build React
FROM node:18-alpine AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Angie
FROM docker.angie.software/angie:latest
COPY --from=build /usr/src/app/dist /usr/share/angie/html
COPY angie.conf /etc/angie/http.d/default.conf

EXPOSE 80
CMD ["angie", "-g", "daemon off;"]
