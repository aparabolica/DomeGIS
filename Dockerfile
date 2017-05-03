FROM nodesource/trusty:0.10

ENV DEBIAN_FRONTEND noninteractive

# Install base dependencies
RUN apt-get update -y 																	&& \
		apt-get install -y																		 \
 			wget git zip build-essential

# RUN	add-apt-repository ppa:ubuntugis/ppa -y  						&& \
RUN	apt-get update -y 																	&& \
		apt-get install -y  				 		 \
			gdal-bin libmapnik2.2 libcairo2-dev libpango1.0-dev  \
			libjpeg8-dev libgif-dev

# GOSU for stepping down from root
ENV GOSU_VERSION 1.7
RUN set -x \
	&& wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
	&& wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
	&& gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
	&& rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
	&& chmod +x /usr/local/bin/gosu \
	&& gosu nobody true


# Setup env
ENV APP_USER=node
ENV HOME=/home/node
ENV DATA=/data

# Add app user
RUN useradd -Ums /bin/bash $APP_USER

# Copy config files and assign app directory permissions
WORKDIR $HOME/domegis
COPY . $HOME/domegis/

# Install global npm dependencies and app
RUN npm install -g nodemon bower && \
  chown -R $APP_USER:$APP_USER $HOME/domegis && \
  gosu $APP_USER:$APP_USER npm install && \
  gosu $APP_USER:$APP_USER bower install -F

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Run node server
CMD ["node", "src/"]
