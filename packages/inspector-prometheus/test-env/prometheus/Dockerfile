FROM prom/prometheus

ARG TZ
ENV TZ=$TZ
RUN echo $TZ | tee /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata
