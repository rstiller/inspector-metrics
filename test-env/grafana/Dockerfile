FROM grafana/grafana:8.4.6

ARG TZ
ENV TZ=$TZ

USER root

RUN apk add tzdata && cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && apk del tzdata

ADD grafana.ini /etc/grafana/grafana.ini

RUN mkdir -p /var/log/grafana/ && chown grafana:root /var/log/grafana/

USER grafana
