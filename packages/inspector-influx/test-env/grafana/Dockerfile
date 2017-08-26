FROM grafana/grafana

ARG TZ
ENV TZ=$TZ
RUN echo $TZ | tee /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

ADD grafana.ini /etc/grafana/grafana.ini

RUN mkdir -p /var/log/grafana/
RUN chown grafana:grafana /var/log/grafana/
