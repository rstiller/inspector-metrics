FROM influxdb

ARG TZ
ENV TZ=$TZ
RUN echo $TZ | tee /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

COPY influxdb.conf /etc/influxdb/influxdb.conf
