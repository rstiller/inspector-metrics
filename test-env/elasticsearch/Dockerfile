FROM docker.elastic.co/elasticsearch/elasticsearch-oss:7.0.0

ARG TZ
ENV TZ=$TZ

USER root
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime

USER elasticsearch
