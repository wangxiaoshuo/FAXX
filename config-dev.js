'use strict';

// 变量 配置
var Constant = {
    'IS_CONFUSION': false,

    'PORT': 4141,

    'APP_URL_LAN': 'http://127.0.0.1:4141',
    'APP_URL_WAN': 'http://tieta.1g9f.com',
    'API_URL_LAN': 'http://127.0.0.1:4242',
    'API_URL_WAN': 'http://tieta-api.1g9f.com',
    // 注意: 局域网 和 广域网 的图片连接适配问题
    'IMAGE_URL': 'http://tieta.1g9f.com',
    'AI_URL': 'http://ai-api.feebird.cn:2828/api/classification/picture.html',

    // 'MAIN_DB_URI': 'mongodb://root:qwe123!@127.0.0.1:27017/',
    'MAIN_DB_URI': 'mongodb://127.0.0.1:27017/',
    'MONGOS': false,
    'COMMON_DB_NAME': 'db_faxx',
    'OPTION_DB_NAME': 'db_option',
    'PLAN_DB_NAME': 'db_plan',
    'MODULE_DB_NAME': 'db_module',
    'MATERIAL_DB_NAME': 'db_material',
    'SERVICE_DB_NAME': 'db_service',
    'AUTH_DB_NAME': 'admin',
    'OAUTH_DB_NAME': 'db_oauth',
    'PRODUCT_DB_PREFIX': 'db_',

    'REDIS_PORT': 6379,
    'REDIS_HOST': '127.0.0.1',

    'MEMCACHED': '127.0.0.1:58888'
}

// 数据 配置
var DataDisks = {
    // // TODO 对拷前必须先实现
    // 'APP': [
    //     '/data/images/mc0_disk1/app/'
    // ],
    // 'API': [
    //     '/data/images/mc1_disk1/api/'
    // ]
    'APP': [
        '/data/ds1_disk1/faxx-app/'
    ],
    'API': [
        '/data/ds1_disk1/faxx-api/'
    ]
}


// 页面 配置
var PageMeta = {
    'zh': {
        'common': '<title>智选优设 - 智慧共享，绿色通信</title>\n\t' +
        '<meta name="keywords" content="智选优设，智慧共享，绿色通信，选址人员，选型人员，设计人员"/>\n\t' +
        '<meta name="description" content="智选优设 - 提高选址人员、选型人员和设计人员的工作效率。"/>'
    },
    'en': {
        'common': '<title>Intellectual selection - intelligence sharing, green communication</title>\n\t' +
        '<meta name="keywords" content="Intellectual selection, and intelligence sharing, green communication, site selection, selection of staff, design staff"/>\n\t' +
        '<meta name="description" content="Intellectual selection set - improve the site selection, type selection and design personnel work efficiency."/>'
    }
}

// 接口 配置
var Api = {
    'SERVER_LIST': [
        'http://127.0.0.1:4445'
    ]
}

// 接口入口 配置
var Entry = {
    'PORT': 4242,
    'RETRIES': 2,// 请求API失败后,重试的次数
}

var Config = {
    Constant: Constant,
    DataDisks: DataDisks,
    PageMeta: PageMeta,
    Api: Api,
    Entry: Entry
}
module.exports = Config