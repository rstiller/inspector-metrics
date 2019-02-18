FROM docker.elastic.co/elasticsearch/elasticsearch-oss:6.6.0

ARG TZ
ENV TZ=$TZ

USER root
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime
RUN bin/elasticsearch-plugin remove ingest-geoip

USER elasticsearch
