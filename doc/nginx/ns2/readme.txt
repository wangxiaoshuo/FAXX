# 修改目录的权限
chmod -R 777 /home/development/AI/public

#安装Nginx
wget -c http://nginx.org/download/nginx-1.11.6.tar.gz
tar -zxvf nginx-1.11.6.tar.gz
cd nginx-1.11.6
./configure --prefix=/etc/nginx --with-http_stub_status_module --with-http_ssl_module  --with-http_realip_module
make && make install
vim /etc/profile
PATH=$PATH:/etc/nginx/sbin
source /etc/profile

# 防止覆盖旧配置
cp -rf /home/development/AI/doc/nginx/ns2/nginx.conf /etc/nginx/conf/nginx.conf
mkdir /etc/nginx/conf/conf.d
cp -rf /home/development/AI/doc/nginx/ns2/conf.d/ai.conf /etc/nginx/conf/conf.d/ai.conf
cp -rf /home/development/AI/doc/nginx/ns2/conf.d/api.conf /etc/nginx/conf/conf.d/api.conf

nginx -t
nginx
nginx -s stop

tail -f /etc/nginx/logs/access.log
tail -f /etc/nginx/logs/error.log