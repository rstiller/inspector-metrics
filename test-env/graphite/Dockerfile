FROM graphiteapp/graphite-statsd

ARG TZ
ENV TZ=$TZ
RUN ln -fs /usr/share/zoneinfo/$TZ /etc/localtime
RUN dpkg-reconfigure --frontend noninteractive tzdata
