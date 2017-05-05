FROM nodesource/trusty:0.10

# Setup environment
ENV DEBIAN_FRONTEND noninteractive
ENV APP_USER=node
ENV APP_USERGROUP=$APP_USER
ENV HOME=/home/node

# Add group and user for running the app
RUN groupadd $APP_USERGROUP && \
    useradd --create-home --home-dir $HOME -g $APP_USERGROUP $APP_USER

# RUN useradd -Ums /bin/bash $APP_USER

# Install base dependencies
RUN apt-get update -y && \
		apt-get install -y --no-install-recommends \
      build-essential \
      git \
      unzip \
      zip \
      wget

# Install GIS dependencies
RUN	apt-get update -y --no-install-recommends && \
		apt-get install -y \
			gdal-bin \
      libcairo2-dev \
      libgif-dev \
      libjpeg8-dev \
      libpango1.0-dev \
      libmapnik2.2

# Install GOSU for stepping down from root
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

# Install command line dependencies
RUN npm install -g pg sequelize sequelize-cli@2.5.1

RUN npm install -g nodemon bower

RUN chown -R $APP_USER:$APP_USERGROUP $HOME/.npm

# Step down to app user
USER $APP_USER

# Install Node.js modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p $HOME/domegis && cp -a /tmp/node_modules $HOME/domegis

# Install Bower components
ADD bower.json /tmp/bower.json
RUN cd /tmp && bower install
RUN mkdir -p $HOME/domegis && cp -a /tmp/bower_components $HOME/domegis

WORKDIR $HOME/domegis
COPY . $HOME/domegis

USER root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Run node server
CMD ["node", "src/"]
