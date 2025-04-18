FROM mcr.microsoft.com/devcontainers/javascript-node:22

ENV PORT 8080
ENV settings /home/site/wwwroot/config/login.dfe.services.tran.json
ENV PATH ${PATH}:/home/site/wwwroot

WORKDIR /home/site/wwwroot

COPY process.json /home/site/wwwroot
#ADD app_data ./home/site/wwwroot_data
COPY node_modules /home/site/wwwroot/node_modules
ADD config /home/site/wwwroot/config
COPY src /home/site/wwwroot/src
COPY package.json /home/site/wwwroot/

ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME

RUN npm install pm2 -g
ENV PM2HOME /pm2home

# enable SSH
ENV SSH_PASSWD "root:Docker!"
RUN mkdir -p /home/LogFiles 
RUN apt-get install -y --no-install-recommends dialog 
RUN apt-get update 
RUN apt-get install -y --no-install-recommends openssh-server 
RUN echo "$SSH_PASSWD" | chpasswd 

# Install powershell related system components
# Import the public repository GPG keys
RUN curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

RUN sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-debian-stretch-prod stretch main" > /etc/apt/sources.list.d/microsoft.list'

# Install PowerShell (comment out for macOS not required)
#RUN apt-get install -y powershell

COPY ./Docker/sshd_config /etc/ssh/sshd_config
COPY ./Docker/init.sh init.sh
COPY ./Docker/tokenization.ps1 tokenization.ps1

RUN chmod 755 init.sh
RUN chmod 755 tokenization.ps1
USER $USERNAME

EXPOSE 8080 2221

CMD ["init.sh"]