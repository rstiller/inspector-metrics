FROM influxdb:1.6

ARG TZ
ENV TZ=$TZ

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime
RUN echo $TZ > /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

COPY influxdb.conf /etc/influxdb/influxdb.conf
