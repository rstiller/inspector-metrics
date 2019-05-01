FROM graphiteapp/graphite-statsd:1.1.5-10

ARG TZ
ENV TZ=$TZ

USER root
RUN echo $TZ > /etc/TZ
RUN rm /etc/localtime && ln -s /usr/share/zoneinfo/$TZ /etc/localtime
