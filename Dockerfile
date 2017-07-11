FROM node:latest
MAINTAINER Felipe Barbosa <lybrbarbosa@gmail.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY . /usr/src/app

EXPOSE 8000 3000 3001 3002 3003 3004 3005 9411

CMD [ "npm", "start" ]