FROM node:latest

ARG TZ
ENV TZ=$TZ

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

RUN npm install -g npm-check @compodoc/compodoc lerna
