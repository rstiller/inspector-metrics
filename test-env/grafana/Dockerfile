FROM grafana/grafana:5.3.2

ARG TZ
ENV TZ=$TZ

USER root

RUN echo $TZ | tee /etc/timezone
RUN dpkg-reconfigure --frontend noninteractive tzdata

ADD grafana.ini /etc/grafana/grafana.ini

RUN mkdir -p /var/log/grafana/
RUN chown grafana:grafana /var/log/grafana/

USER grafana
