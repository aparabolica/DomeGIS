FROM ubuntu:xenial

# Environment variables
ENV NODE_VERSION=6.9.4
ENV NPM_CONFIG_LOGLEVEL warn
ENV DEBIAN_FRONTEND noninteractive
ENV APP_USER=node
ENV APP_USERGROUP=$APP_USER
ENV HOME=/home/node

# Add group and user for running the app
RUN groupadd $APP_USERGROUP && \
    useradd --create-home --home-dir $HOME -g $APP_USERGROUP $APP_USER

# Install packages dependencies (based on nodesource/trusty-base)
RUN apt-get update \
    && apt-get install -y --no-install-recommends\
      apt-transport-https \
      ssh-client \
      build-essential \
      ca-certificates \
      git \
      libicu-dev \
      'libicu[0-9][0-9].*' \
      lsb-release \
      python-all \
      rlwrap \
      software-properties-common \
      zip unzip \
      wget \
    && rm -rf /var/lib/apt/lists/*;

# Install Node.js from Nodesource
RUN wget https://deb.nodesource.com/node_6.x/pool/main/n/nodejs/nodejs_$NODE_VERSION-1nodesource1~trusty1_amd64.deb -O node.deb \
  && dpkg -i node.deb \
  && rm node.deb

# Install Windshaft dependencies (Mapnik 3.0 and others)
RUN add-apt-repository ppa:ubuntugis/ppa \
    && apt-get update \
    && apt-get install -y \
      gdal-bin \
      libcairo2-dev \
      libgif-dev \
      libjpeg8-dev \
      libpango1.0-dev \
      mapnik-utils \
    && rm -rf /var/lib/apt/lists/*;

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

# Copy config files and assign app directory permissions
WORKDIR $HOME/domegis
COPY . $HOME/domegis/

# Fix permissings to user's .npm folder
RUN chown -R $APP_USER:$APP_USERGROUP $HOME

# Install global npm dependencies and app
RUN npm install -g node-gyp pg sequelize sequelize-cli nodemon bower && \
  chown -R $APP_USER:$APP_USER $HOME/domegis && \
  gosu $APP_USER:$APP_USER npm install && \
  gosu $APP_USER:$APP_USER bower install -F

# Patch entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Run node server
CMD ["node", "src/"]
