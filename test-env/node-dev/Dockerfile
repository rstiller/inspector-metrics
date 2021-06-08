FROM node:16

ARG TZ
ENV TZ=$TZ

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

RUN apt update -y && apt install -y rsync sudo
RUN npm install -g npm-check @compodoc/compodoc pnpm
