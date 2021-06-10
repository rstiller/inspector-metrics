FROM prom/prometheus:v2.27.1

ARG TZ
ENV TZ=$TZ

USER root
RUN echo $TZ > /etc/TZ
RUN rm /etc/localtime && ln -s /usr/share/zoneinfo/$TZ /etc/localtime

VOLUME /prometheus-data
