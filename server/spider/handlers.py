# !/usr/bin/python
# -*- coding: utf-8 -*-

import os, re, json

from scrapy.utils.misc import walk_modules
from scrapy.utils.spider import iter_spider_classes
from server.spider.monitor import Monitor
from tornado.web import url, Application, RequestHandler, HTTPError

from server.config.utils import json_encode
from server.spider.handler_utils import ApiHandler
from server.spider.spider import CrawlWebsiteSpider, create_crawler, CrawlEntranceSpider
from server.spider.scrapy_thread import thread_crawl
from server.db.db import MongodbLink

class BaseRequestHandler(RequestHandler):
    """基础请求处理类"""
    def initialize(self, crawler_process, opts):
        self.crawler_process = crawler_process
        self.opts = opts

    def render(self, *args, **kwargs):
        proc_stats = self.crawler_process.procmon.get_recent()
        kwargs['initial_process_stats_json'] = json_encode(proc_stats)
        return super(BaseRequestHandler, self).render(*args, **kwargs)

class _ControlJobHandler(ApiHandler, BaseRequestHandler):
    """任务处理类"""
    def control_job(self, job_id):
        raise NotImplementedError

    def post(self):
        if self.is_json:
            job_id = int(self.json_args['job_id'])
            self.control_job(job_id)
            self.write({"status": "ok"})
        else:
            job_id = int(self.get_body_argument('job_id'))
            self.control_job(job_id)
            self.redirect("/")


def get_spider_cls(url, spider_packages, default=CrawlWebsiteSpider):
    """获取spider类"""
    if url.startswith('spider://'):
        spider_name = url[len('spider://'):]
        return find_spider_cls(spider_name, spider_packages)
    return default

def find_spider_cls(spider_name, spider_packages):
    """查找spider"""
    for package_name in spider_packages:
        for module in walk_modules(package_name):
            for spider_cls in iter_spider_classes(module):
                if spider_cls.name == spider_name:
                    return spider_cls

def get_application(crawler_process, opts):
    """入口配置"""
    # 路径函数
    at_root = lambda *args: os.path.join(os.path.dirname(os.path.dirname(__file__)), *args)
    # scrapy进程和参数
    context = {
        'crawler_process': crawler_process,
        'opts': opts
    }
    debug = opts['spider']['debug']

    handlers = [
        url(r'/', Index, context, name='index'),
        url(r'/help', Help, context, name='help'),
        url(r"/crawler/start", StartCrawler, context, name='start'),
        url(r"/crawler/stop", StopCrawler, context, name='stop'),
        url(r"/crawler/pause", PauseCrawler, context, name='pause'),
        url(r"/crawler/resume", ResumeCrawler, context, name='resume'),
        url(r"/crawler/status", CrawlerStatus, context, name='status'),
        url(r"/ws-updates", Monitor, context, name='ws'),
        url(r'/add/config', Config, context, name='config'),
        url(r'/add/work', Work, context, name='work'),
        url(r'/add/next', Next, context, name='next'),
        url(r'/data', Data, context, name='data'),
        url(r'/data/columns', CollectionColumns, context, name='columns'),
        url(r'/data/collection', CollectionData, context, name='collection_data'),
        url(r'/data/save', DateSave, context, name='save'),
        url(r'/data/delete', DateDelete, context, name='delete'),
        url(r'/read', Read, context, name='read'),
        url(r'/read/collection', CollectionRead, context, name='collection_read'),
        url(r'.*', ErrorHandler, context, name='error')
    ]

    return Application(
        handlers=handlers,
        template_path=at_root('templates'),
        compiled_template_cache=not debug,
        static_hash_cache=not debug,
        static_path=at_root('static'),
        compress_response=True
    )

class Index(BaseRequestHandler):
    """入口界面"""
    def get(self):
        # TODO
        jobs = self.crawler_process.jobs
        initial_data_json = json_encode({'jobs': jobs})
        return self.render("index.html", initial_data_json=initial_data_json)

class Help(BaseRequestHandler):
    """帮助界面"""
    def get(self):
        return self.render("help.html")

class StartCrawler(ApiHandler, BaseRequestHandler):
    """开始job"""
    def post(self):
        if self.is_json:
            name = self.json_args['config'].get('name', '')
            url = self.json_args['config'].get('url', '')
            method = self.json_args['config'].get('method', '')
            proxy = self.json_args['config'].get('proxy', 0)
            dynamic = self.json_args['config'].get('dynamic', 0)
            header = self.json_args['config'].get('header', '{}')
            cookie = self.json_args['config'].get('cookie', '{}')
            form = self.json_args['config'].get('form', '{}')
            selectors = self.json_args['selectedField'].get('selectors', [])
            requestInterval = self.json_args['requestInterval']
            pageLoadDelay = self.json_args['pageLoadDelay']
            # 字段验证
            fields = [i['id'] for i in selectors if i['type'] in ['SelectorText', 'SelectorElementAttribute', 'SelectorHTML', 'SelectorImage']]
            mongo = MongodbLink()
            if not name:
                self.set_header('Content-Type', 'application/json; charset=UTF-8')
                return self.write(json_encode({'state': False, 'message': '配置名称为空'}))
            db = mongo.get_db()
            result = mongo.exe_search_one(db[name], {})
            if name == 'config':
                self.set_header('Content-Type', 'application/json; charset=UTF-8')
                return self.write(json_encode({'state': False, 'message': '配置名称不能为config'}))
            if not result['state']:
                self.set_header('Content-Type', 'application/json; charset=UTF-8')
                return self.write(json_encode([]))
            if result['data']:
                db_fields = [i for i in result['data'] if i != "_id"]
                for i in fields:
                    if i not in db_fields:
                        self.set_header('Content-Type', 'application/json; charset=UTF-8')
                        return self.write(json_encode({'state': False, 'message': '采集字段和数据库已有字段不符, 请修改配置名或修改采集字段.'}))

            # settings设置
            # 代理服务器
            settings = {}
            settings['DOWNLOADER_MIDDLEWARES'] = {}
            if proxy:
                settings = {
                    'DOWNLOADER_MIDDLEWARES': {
                        'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 542,
                        'server.spider.middlewares.ProxyIPMiddleware': 100
                    }
                }
            # 动态加载
            if dynamic:
                settings['DOWNLOADER_MIDDLEWARES'].update({
                    # 关闭默认下载器
                    'scrapy.contrib.downloadermiddleware.useragent.UserAgentMiddleware': None,
                    'server.spider.middlewares.PhantomJSMiddleware': 543
                })
            # 下载间隔
            if requestInterval: settings['DOWNLOAD_DELAY'] = requestInterval
            if self.crawl(url, name, CrawlWebsiteSpider, method, header, cookie, form, settings, selectors, pageLoadDelay):
                return self.write({'state': True, 'message': 'success'})
            else:
                raise HTTPError(400)
        else:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            self.write(json.dumps({'state': False, 'message': '程序启动失败<br>字段选择器格式错误，或缺失字段，请检查.'}))
            self.finish()

    def crawl(self, url, name, spider_cls, method, header, cookie, form, settings, selectors, pageLoadDelay):
        """启动spider"""
        # 存储
        # storage_opts = self.opts['spider.storage']
        # settings = {
        #     'MOTOR_PIPELINE_ENABLED': storage_opts['enabled'],
        #     'MOTOR_PIPELINE_DB_NAME': storage_opts['db_name'],
        #     'MOTOR_PIPELINE_DB': storage_opts['db_name'],
        #     'MOTOR_PIPELINE_URI': storage_opts['uri'],
        # }
        spider_cls = get_spider_cls(url, spider_cls)
        if spider_cls is not None:
            self.crawler = create_crawler(settings, spider_cls=spider_cls, name=name, url=url, method=method, header=header,
                                          cookie=cookie, form=form, selectors=selectors, pageLoadDelay=pageLoadDelay)
            self.crawler_process.crawl(self.crawler)
            return True
        return False

class StopCrawler(_ControlJobHandler):
    """停止job"""
    def control_job(self, job_id):
        self.crawler_process.stop_job(job_id)

class PauseCrawler(_ControlJobHandler):
    """暂停任务"""
    def control_job(self, job_id):
        self.crawler_process.pause_job(job_id)

class ResumeCrawler(_ControlJobHandler):
    """恢复任务"""
    def control_job(self, job_id):
        self.crawler_process.resume_job(job_id)

class CrawlerStatus(BaseRequestHandler):
    """job状态"""
    def get(self):
        crawl_ids_arg = self.get_argument('crawl_ids', '')
        if crawl_ids_arg == '':
            jobs = self.crawler_process.get_jobs()
        else:
            crawl_ids = set(map(int, crawl_ids_arg.split(',')))
            jobs = [job for job in self.crawler_process.get_jobs()
                    if job['id'] in crawl_ids]
        return self.write(json_encode({'jobs': jobs}))

class Config(BaseRequestHandler):
    """添加配置"""
    def get(self):
        return self.render('config.html')

class Work(BaseRequestHandler):
    """添加字段"""
    def post(self):
        name = self.get_argument('name', '').replace('"', '')
        url = self.get_argument('url', '').replace('"', '')
        method = self.get_argument('method', '').replace('"', '')
        proxy = int(self.get_argument('proxy', 0))
        dynamic = int(self.get_argument('dynamic', 0))
        header = json.loads(self.get_argument('header', '{}'))
        cookie = json.loads(self.get_argument('cookie', '{}'))
        form = json.loads(self.get_argument('form', '{}'))
        config_data = json_encode({'name': name, 'url': url, 'method': method, 'proxy': proxy, 'dynamic': dynamic, 'header': header, 'cookie': cookie, 'form': form})
        # 代理服务器
        settings = {}
        settings['DOWNLOADER_MIDDLEWARES'] = {}
        if proxy:
            settings = {
                'DOWNLOADER_MIDDLEWARES': {
                    'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 542,
                    'server.spider.middlewares.ProxyIPMiddleware': 100
                }
            }
        # 动态加载
        if dynamic:
            settings['DOWNLOADER_MIDDLEWARES'].update({
                # 关闭默认下载器
                'scrapy.contrib.downloadermiddleware.useragent.UserAgentMiddleware': None,
                'server.spider.middlewares.PhantomJSMiddleware': 543
            })
        if not url:
            return self.render('config.html')
        # 启动spider
        result = thread_crawl(url, CrawlEntranceSpider, method, header, cookie, form, settings)
        if result:
            return self.render('work.html', config_data=config_data)
        else:
            return self.write('waiting')

class Next(BaseRequestHandler):
    """跳转详情页"""
    def post(self):
        name = self.get_argument('name', '').replace('"', '')
        url = self.get_argument('url', '').replace('"', '')
        method = self.get_argument('method', '').replace('"', '')
        proxy = int(self.get_argument('proxy', 0))
        dynamic = int(self.get_argument('dynamic', 0))
        header = json.loads(self.get_argument('header', '{}'))
        cookie = json.loads(self.get_argument('cookie', '{}'))
        form = json.loads(self.get_argument('form', '{}'))
        # 代理服务器
        settings = {}
        settings['DOWNLOADER_MIDDLEWARES'] = {}
        if proxy:
            settings = {
                'DOWNLOADER_MIDDLEWARES': {
                    'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 542,
                    'server.spider.middlewares.ProxyIPMiddleware': 100
                }
            }
        # 动态加载
        if dynamic:
            settings['DOWNLOADER_MIDDLEWARES'].update({
                # 关闭默认下载器
                'scrapy.contrib.downloadermiddleware.useragent.UserAgentMiddleware': None,
                'server.spider.middlewares.PhantomJSMiddleware': 543
            })
        if not url:
            return self.render('config.html')
        # 启动spider
        result = thread_crawl(url, CrawlEntranceSpider, method, header, cookie, form, settings)
        if result:
            return self.write('success')
        else:
            return self.write('fail')

class Data(BaseRequestHandler):
    """查看数据"""
    def get(self):
        mongo = MongodbLink()
        db = mongo.get_db()
        collection_names = db.collection_names()
        result = [{"text": "数据集合", "nodes": [{'text': j} for i, j in enumerate(collection_names) if j != 'config']}]
        return self.render('data.html', collection_names=result)

class CollectionColumns(BaseRequestHandler):
    """获取集合字段"""
    def get(self):
        mongo = MongodbLink()
        collection_name = self.get_argument('collection_name', '')
        if not collection_name:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode([]))
        db = mongo.get_db()
        result = mongo.exe_search_one(db[collection_name], {})
        if not result['state']:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode([]))
        fields = result['data']
        if not fields:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode([]))
        result = [{'field': i, 'title': i} for i in fields if i != "_id"]
        self.set_header('Content-Type', 'application/json; charset=UTF-8')
        return self.write(json_encode(result))

class CollectionData(BaseRequestHandler):
    """获取集合中数据"""
    def get(self):
        mongo = MongodbLink()
        collection_name = self.get_argument('collection_name', '')
        if not collection_name:
            return self.write([])
        # limit = int(self.get_argument('limit', 10))
        # offset = int(self.get_argument('offset', 10))
        # limit = 50 if limit > 50 else limit
        # offset = 50 if offset > 50 else offset
        # 查询数据
        db = mongo.get_db()
        # result = mongo.exe_search_page(db[collection_name], {}, limit, offset)
        result = mongo.exe_search(db[collection_name], {})
        if not result['state']:
            return self.write([])
        else:
            for i in result['data']: del i["_id"]
        self.set_header('Content-Type', 'application/json; charset=UTF-8')
        # 查询总数
        total = mongo.exe_count(db[collection_name], {})
        # self.write(json_encode({'total': total['data'], 'rows': result['data']}))
        self.write(json_encode({'total': total['data'], 'data': result['data']}))

class DateSave(BaseRequestHandler):
    """保存数据"""
    def post(self):
        mongo = MongodbLink()
        selectedField = json.loads(self.get_argument('selectedField', '{}'))
        config = json.loads(self.get_argument('config', '{}'))
        # 请求间隔
        requestInterval = int(self.get_argument('requestInterval', 0))
        # 翻页间隔
        pageLoadDelay = int(self.get_argument('pageLoadDelay', 0))
        # 查空
        if not selectedField or not config:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '无法获取配置, 请检查.'}))
        # 查重
        count = mongo.exe_count(config, {'config.name': config['name']})
        if not count:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '配置名称已存在, 请修改.'}))
        # 保存数据
        request = {'selectedField': selectedField, 'config': config, 'requestInterval': requestInterval, "pageLoadDelay": pageLoadDelay}
        conf = mongo.get_config()
        result = mongo.exe_insert(conf, request)
        if not result['state']:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '保存配置失败.'}))
        else:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': True, 'message': 'success'}))

class DateDelete(BaseRequestHandler):
    """删除数据"""
    def get(self):
        mongo = MongodbLink()
        name = self.get_argument('name', '')
        print(name)
        # 查空
        if not name:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '无法获取参数, 请检查.'}))
        # 删除数据
        request = {'config.name': name}
        conf = mongo.get_config()
        result = mongo.exe_remove(conf, request)
        if not result['state']:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '删除配置失败.'}))
        else:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': True, 'message': 'success'}))

class Read(BaseRequestHandler):
    """读取配置"""
    def get(self):
        # 查询配置
        mongo = MongodbLink()
        conf = mongo.get_config()
        data = mongo.exe_search(conf, {})
        if not data['data']:
            return self.render('read.html', result=[{"text": "配置集合", "nodes": []}])
        result = [{"text": "配置集合", "nodes": [{'text': i['config']['name']} for i in data['data']]}]
        return self.render('read.html', result=result)

class CollectionRead(BaseRequestHandler):
    """读取配置集合"""
    def get(self):
        name = self.get_argument('name', '')
        if not name:
            self.set_header('Content-Type', 'application/json; charset=UTF-8')
            return self.write(json_encode({'state': False, 'message': '字段值为空'}))
        # 查询配置数据
        mongo = MongodbLink()
        conf = mongo.get_config()
        conf_data = mongo.exe_search_one(conf, {'config.name': name})
        del conf_data['data']['_id']
        self.set_header('Content-Type', 'application/json; charset=UTF-8')
        return self.write(json_encode({'state': True, 'message': 'success', 'data': conf_data['data']}))



class ErrorHandler(BaseRequestHandler):
    """异常界面处理"""
    def get(self):
        return self.write_error(404)

    def write_error(self, status_code, **kwargs):
        if status_code == 404:
            self.render('error_status/404.html')
        elif status_code == 500:
            self.render('error_status/500.html')
        else:
            self.write('error'+ str(status_code))
