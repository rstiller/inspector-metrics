FROM docker.elastic.co/kibana/kibana-oss:7.10.2

ARG TZ
ENV TZ=$TZ

USER root
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime
RUN mkdir -p /var/log/kibana/
RUN chown kibana:kibana /var/log/kibana/

USER kibana
