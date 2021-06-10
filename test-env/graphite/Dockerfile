FROM graphiteapp/graphite-statsd:1.1.8-1

ARG TZ
ENV TZ=$TZ

USER root
RUN apk add tzdata && cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && apk del tzdata
