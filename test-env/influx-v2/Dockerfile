FROM influxdb:2.0

ARG TZ
ENV TZ=$TZ

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

COPY config.yml /etc/influxdb2/config.yml
