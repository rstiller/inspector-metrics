FROM prom/pushgateway:v0.6.0

ARG TZ
ENV TZ=$TZ
RUN echo $TZ > /etc/TZ
RUN rm /etc/localtime && ln -s /usr/share/zoneinfo/$TZ /etc/localtime
