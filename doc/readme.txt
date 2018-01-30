所有API, 想法子控制登录
->暂缓, 升级项目需要再搞

2、各种角色运转用户体验问题: 如何交接?->推送前指定用户? 如何管理?->新增方案记录?
->角色和地市为基准设计处理流程
3、录入数据问题: 新增追加功能? 用户信息表格录入?
->OK


设计支持模块物资和服务修改、数量修改
->欠修改更新方案


方案记录
->欠用户地域和角色查找对应数据
->要有搜索功能

微信网页授权登录
->待营业执照
微信开发精准推送
->待营业执照

【微信公众号信息】
sansidekeji@163.com
allen2008
AppID
wx2a42ec6704de83fe
AppSecret
79e53c443838dce637ab3ad9e67ad566
李有圣 18381056371

【花生壳信息】
chenzhizhuan
angel192023

a2940519
qq123456
13557832802

karlhua
qwe123
15913804360
440981199102220814

【阿里信息】
帐号:yangxin_king800322
密码:yangxin800930

【MC服务器】
tmux
redis-server /etc/redis.conf
memcached -p 58888 -I 5m -m 4096 -t 32 -c 2048 -u root -d
mongod --dbpath /home/mongo/db
nginx
cd /home/software/phddns2
./phddns restart
cd /home/development/MC
pm2 start pm2.json
pm2 logs


【MC数据服务器|20170222重置数据文件】
#入库启动脚本（必须普通用户?）
screen -S pla
python MC_plat.py
Ctrl + A + D
screen -ls
screen -r 7041
screen -wipe 7041
#截图识别脚本（必须超级用户?）
screen -S imp
python MC_important.py
screen -S ord
python MC_ordinary.py


