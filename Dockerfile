### STAGE 1: Build ###
FROM node:alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:alpine
COPY --from=build /app/dist/calendar-events /usr/share/nginx/html




# First stage image labelled as node-angular-cli
# FROM node:alpine as node-angular-cli
# LABEL authors="Siddardha"
 
# # Building Angular app
# WORKDIR /app
# COPY package.json /app
# RUN npm install
# COPY . /app
# RUN npm run build -- --prod
 
# # This image will be used for creating container
# FROM node:alpine
# WORKDIR /app
# # Copying dist folder from node-angular-cli image
# COPY --from=node-angular-cli /app/dist ./dist
# EXPOSE 80
# ENV PORT 80
# RUN npm install http-server -g
# CMD [ "http-server" ]