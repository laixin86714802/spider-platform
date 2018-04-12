# !/usr/bin/python
# -*- coding: utf-8 -*-

import re, os, urllib.parse, requests
from bs4 import BeautifulSoup

from scrapy.http.request import Request
from scrapy import FormRequest
import scrapy, logging, datetime
from scrapy.http.response.html import HtmlResponse
from scrapy.selector import Selector
from itertools import zip_longest

from server.spider.crawler_process import MyselfCrawler
from server.config.opts import opts
from server.db.db import MongodbLink


DEFAULT_SETTINGS = {
    'DEPTH_STATS_VERBOSE': True,
    'DEPTH_PRIORITY': 0,
    'BOT_NAME': 'spider_platform',
    'USER_AGENT': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.221 Safari/537.36 SE 2.X MetaSr 1.0',
    'LOG_LEVEL': 'DEBUG',
    'TELNETCONSOLE_ENABLED': False,
    # 'STATS_CLASS': 'server.spider.stats.EventedStatsCollector',
    'DOWNLOADER': 'server.spider.crawler_process.MyselfDownloader',
    # 'ITEM_PIPELINES': {
    #     'server.spider.motor_exporter.pipelines.MotorPipeline': 100,
    # },
    'MOTOR_PIPELINE_JOBID_KEY': '_job_id',
    # 超时时间
    'DOWNLOAD_TIMEOUT': 30
}

def create_crawler(settings=None, spider_cls=None, **kwargs):
    """生成crawler类"""
    _settings = DEFAULT_SETTINGS.copy()
    _settings.update(settings or {})
    return MyselfCrawler(spider_cls, _settings, **kwargs)

class BaseSpider(scrapy.Spider):
    """基类spider"""
    crawl_id = None
    domain = None
    motor_job_id = None

    def __init__(self, *args, **kwargs):
        super(BaseSpider, self).__init__(*args, **kwargs)
        # 不要把日志配置到domain中
        logging.getLogger("scrapy.core.scraper").setLevel(logging.INFO)

    def get_page_item(self, response, _type='page'):
        """spider日志"""
        return {
            'crawled_at': datetime.datetime.now(),
            'url': response.url,
            'status': response.status,
            'headers': response.headers,
            'body': response.body_as_unicode(),
            'meta': response.meta,
            '_type': _type
        }

class CrawlEntranceSpider(BaseSpider):
    """入口页面加载"""
    name = "Enter"
    # 起始url
    start_url = ''
    # 请求方式
    method = ''
    # post表单
    form = {}
    # cookie
    cookie = {}
    # 覆写setting
    # custom_settings = {}

    def __init__(self, url, method, header, form, cookie, *args, **kwargs):
        """外部参数引入url"""
        super(CrawlEntranceSpider, self).__init__(*args, **kwargs)
        self.start_url = url
        self.method = method
        self.header = header
        self.form = form
        self.cookie = cookie

    def start_requests(self):
        """初始化请求"""
        # 请求方式
        if self.method.lower() == 'post':
            request = FormRequest(url=self.start_url, formdata=self.form, cookies=self.cookie, callback=self.parse, dont_filter=True)
        else:
            request = Request(url=self.start_url, cookies=self.cookie, callback=self.parse, dont_filter=True)
        # 动态加载
        # request.meta['PantomJs'] = True
        yield  request

    def parse(self, response):
        """写入文件"""
        # 本地ip, 端口
        host = 'localhost' if opts['spider']['host'] == '0.0.0.0' else opts['spider']['host']
        port = opts['spider']['port']
        localhost = 'http://' + host + ':' + port
        # 判断响应结果
        if not isinstance(response, HtmlResponse):
            self.logger.info("non-HTML response is skipped: %s", response.url)
            return
        # 响应对象
        soup = BeautifulSoup(response.body, 'html.parser')
        # 查找url中host
        _, rest = urllib.parse.splittype(response.url)
        host, _ = urllib.parse.splithost(rest)

        res = soup.prettify()
        res = res.replace('target="_blank"', '')
        # 查找jquery
        for i in re.findall("<script.*?>", res, re.S | re.I)\
                + re.findall("<img.*?>", res, re.S | re.I)\
                + re.findall("<iframe.*?>", res, re.S | re.I):
            if not isinstance(i, str):
                continue
            result = re.findall('''src=(['|"].*?)['|"]''', i, re.S | re.I)
            if not result:
                continue
            if re.findall('^(?!http|javascript|//)/?\w.*?$', result[0][1:], re.S | re.I) or result[0][1:].startswith(
                    "."):
                _, script_rest = urllib.parse.splittype(result[0])
                script_host, _ = urllib.parse.splithost(script_rest)
                if not script_host:
                    if result[0][1:].startswith(".."):
                        new_val = result[0][0] + result[0][3:]
                    elif result[0][1:].startswith("."):
                        new_val = result[0][0] + result[0][2:]
                    elif not result[0][1:].startswith("/"):
                        new_val = result[0][0] + "/" + result[0][1:]
                    else:
                        new_val = result[0]
                    res = res.replace("src=" + result[0] + result[0][0], 'src=' + new_val[0] + '//' + host + new_val[1:] + new_val[0])

        for i in re.findall("<a.*?/a>", res, re.S | re.I) + re.findall("<link.*?>", res, re.S | re.I):
            if not isinstance(i, str):
                continue
            result =  re.findall('''href=(['|"].*?)['|"]''', i, re.S | re.I)
            if not result:
                continue
            if re.findall('^(?!http|javascript|//)/?\w.*?$', result[0][1:], re.S | re.I) or result[0][1:].startswith(
                    "."):
                _, script_rest = urllib.parse.splittype(result[0])
                script_host, _ = urllib.parse.splithost(script_rest)
                if not script_host:
                    if result[0][1:].startswith(".."):
                        new_val = result[0][0] + result[0][3:]
                    elif result[0][1:].startswith("."):
                        new_val = result[0][0] + result[0][2:]
                    elif not result[0][1:].startswith("/"):
                        new_val = result[0][0] + "/" + result[0][1:]
                    else:
                        new_val = result[0]
                    res = res.replace("href=" + result[0] + result[0][0], 'href=' + new_val[0] + '//' + host + new_val[1:] + new_val[0])

        soup = BeautifulSoup(res, 'html.parser')
        # 添加jquery
        jquery = soup.new_tag("script", src=localhost+'/static/lib/jquery-2.1.4.min.js')
        soup.body.append(jquery)
        # jqueryAlias = soup.new_tag("script")
        # jqueryAlias.string =
        # 添加soup对象集合
        soupHeadArr = []
        # js 文件
        scriptArr = [
            '/static/scripts/ContentSelector.js',
            '/static/lib/css-selector/lib/CssSelector.js',
            '/static/scripts/ElementQuery.js',
            '/static/scripts/DataExtractor.js',
            '/static/lib/sugar-1.4.1.js',
            '/static/lib/jquery.whencallsequentially.js',
            '/static/lib/jquery.mloading.js',
            '/static/scripts/UniqueElementList.js',
            '/static/lib/ajaxhook.js'
        ]
        # css文件
        linkArr = [
            '/static/lib/bootstrap-3.3.7/css/bootstrap.css',
            '/static/css/content_script.css',
            '/static/css/jquery.mloading.css'
        ]

        for i in scriptArr:
            soupHeadArr.append(soup.new_tag("script", src=localhost+i))

        for i in linkArr:
            soupHeadArr.append(soup.new_tag("link", rel="stylesheet", href=localhost+i))

        for i in soupHeadArr:
            soup.body.append(i)

        # 不带referer
        metaReferer = soup.new_tag("meta")
        metaReferer.attrs = {'name': 'referrer', 'content': 'never'}

        # 页面内点击
        startScript = soup.new_tag("script")
        startScript.string = '''$('*').bind('click.custom', function(event){
            event.preventDefault();
            if (/sitemap-select/.test($(event.currentTarget).attr('class'))){
                return false;
            }
            if (event.target.nodeName.toLowerCase() == 'a'){
                // 深拷贝
                $("body").mLoading("show");
                var params = JSON.parse(JSON.stringify(parent.CONFIG_DATA))
                params.url = event.currentTarget.href;
                params.header = JSON.stringify(params.header)
                params.cookie = JSON.stringify(params.cookie)
                params.form = JSON.stringify(params.form)
                $.ajax({
                    url: "%s/add/next",
                    type: "post",
                    data: params
                }).done(function (data){
                    location.reload();
                }).fail(function (data){
                    console.log(data);
                }).always(function (){
                    $("body").mLoading("hide");
                })
            }
            return false;
        });''' % localhost
        # 拦截所有ajax请求
        hookScript = soup.new_tag("script")
        hookScript.string = '''hookAjax({
            open: function(arg){
                return arg[1] == '%s/add/next' ?  false : true;
            } 
        });''' % localhost
        soup.head.append(metaReferer)
        soup.body.append(startScript)
        soup.body.append(hookScript)
        # 字符串美化
        res = soup.prettify()

        path = os.getcwd() + r'\server\static\spider\start.html'
        os.remove(path)
        fw = open(path, 'wb')
        fw.write(res.encode('utf-8', 'ignore'))
        fw.close()

class CrawlWebsiteSpider(BaseSpider):
    """网站爬虫"""
    name = 'CrawlWebsiteSpider'
    # 起始url
    start_url = ''
    # 请求方式
    method = ''
    # post表单
    form = {}
    # cookie
    cookie = {}
    # 选择器
    selectors = []
    # 翻页间隔
    pageLoadDelay = 0
    # 覆写settings
    # custom_settings = {
    #     # 爬取深度
    #     'DEPTH_LIMIT': 2
    # }

    def __init__(self, url, name, method, header, form, cookie, selectors, pageLoadDelay, *args, **kwargs):
        super(CrawlWebsiteSpider, self).__init__(*args, **kwargs)
        self.task_name = name
        self.start_url = url
        self.method = method
        self.header = {'USER_AGENT': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.221 Safari/537.36 SE 2.X MetaSr 1.0'}
        self.header.update(header)
        self.form = form
        self.cookie = cookie
        self.selectors = selectors
        self.pageLoadDelay = pageLoadDelay
        # 数据库
        self.mongo = MongodbLink()

    def start_requests(self):
        """初始化请求资源"""
        self.logger.info("Started job %s, #%d for domain %s", self.motor_job_id, self.crawl_id, self.domain)

        # 请求方式
        if self.method.lower() == 'post':
            request = FormRequest(url=self.start_url, formdata=self.form, cookies=self.cookie, callback=self.parse_first, dont_filter=True)
        else:
            request = Request(url=self.start_url, cookies=self.cookie, callback=self.parse_first, dont_filter=True)
        yield request

    def parse_first(self, response):
        """web socket参数"""
        _, rest = urllib.parse.splittype(response.url)
        host, _ = urllib.parse.splithost(rest)
        self.domain = host
        self.crawler.stats.set_value('arachnado/start_url', self.start_url)
        self.crawler.stats.set_value('arachnado/domain', self.domain)

        for elem in self.parse(response):
            yield elem

    def detail_first(self, response):
        """详情页参数"""
        _, rest = urllib.parse.splittype(response.url)
        host, _ = urllib.parse.splithost(rest)
        self.domain = host
        self.crawler.stats.set_value('arachnado/start_url', self.start_url)
        self.crawler.stats.set_value('arachnado/domain', self.domain)

        for elem in self.get_detail(response):
            yield elem

    def parse(self, response):
        """响应处理函数"""
        # 判断响应结果
        if not isinstance(response, HtmlResponse):
            self.logger.info("non-HTML response is skipped: %s", response.url)
            return
        # 根目录选择器
        root_selectors = [i for i in self.selectors if i["parentSelectors"][0] == "_root"]
        # 结果集
        result = {}
        # 翻页url
        link = ''
        # 遍历根目录选择器
        for root_selector in root_selectors:
            # text类型选择器
            if root_selector["type"] == "SelectorText":
                text = self.text_resolve(root_selector, response)
                # 非多元素
                if text and not root_selector["multiple"]:
                    text = [text[0]]
                # 正则过滤
                if 'regex' in root_selector and root_selector["regex"]:
                    text = [re.findall(root_selector["regex"], i)[0] if re.findall(root_selector["regex"], i) else "" for i in text]
                result[root_selector['id']] = text
            # image类型选择器
            elif root_selector["type"] == "SelectorImage":
                image = self.image_resolve(root_selector, response)
                # 非多元素
                if image and not root_selector["multiple"]:
                    image = [image[0]]
                result[root_selector['id']] = image
            # attribute类型选择器
            elif root_selector["type"] == "SelectorElementAttribute":
                attribute = self.attribute_resolve(root_selector, response)
                # 非多元素
                if attribute and not root_selector["multiple"]:
                    attribute = [attribute[0]]
                # 正则过滤
                if 'regex' in root_selector and root_selector["regex"]:
                    attribute = [re.findall(root_selector["regex"], i)[0] if re.findall(root_selector["regex"], i) else "" for i in attribute]
                result[root_selector['id']] = attribute
            # html类型选择器
            elif root_selector["type"] == "SelectorHTML":
                html = self.html_resolve(root_selector, response)
                # 非多元素
                if html and not root_selector["multiple"]:
                    html = [html[0]]
                # 正则过滤
                if 'regex' in root_selector and root_selector["regex"]:
                    html = [re.findall(root_selector["regex"], i)[0] if re.findall(root_selector["regex"], i) else "" for i in html]
                result[root_selector['id']] = html
            # link类型选择器
            elif root_selector["type"] == "SelectorLink":
                if 'first' not in response.meta:
                    link = self.link_resolve(root_selector, response)

        # element类型选择器
        element_selectors = [i for i in self.selectors if i["parentSelectors"][0] == "_root" and i["type"]== "SelectorElement"]
        # detail类型选择器
        detail_selectors = [i for i in self.selectors if i["parentSelectors"][0] == "_root" and i["type"] == "SelectorDetail"]
        if element_selectors:
            element_multiple = element_selectors[0]["type"]
            for elem in self.element_parse(element_selectors[0], response, element_multiple, result):
                yield elem

        elif detail_selectors:
            detail_multiple = detail_selectors[0]["type"]
            detail_urls = self.detail_resolve(detail_selectors[0], response, detail_multiple)
            child_selectors = [i for i in self.selectors if i["parentSelectors"][0] == detail_selectors[0]["id"]]
            if not detail_urls or not child_selectors:
                # 数据集入库
                result_items = self.data_resolve(result)
                for result_item in result_items:
                    self.load_to_db(result_item)
            else:
                for elem in self.detail_parse(detail_selectors[0], detail_urls, child_selectors, result, response):
                    yield elem
        else:
            # 数据集入库
            result_items = self.data_resolve(result)
            for result_item in result_items:
                self.load_to_db(result_item)

        # 翻页
        if link:
            if isinstance(link, list):
                for i in range(link[1], link[2]):
                    if self.method.lower() == 'post':
                        request = FormRequest(url=link[0] % str(i), formdata=self.form, cookies=self.cookie, meta={'first': False}, dont_filter=True)
                    else:
                        request = Request(url=link[0] % str(i), cookies=self.cookie, meta={'first': False}, dont_filter=True)
                    yield request
            if isinstance(link, str):
                if self.method.lower() == 'post':
                    request = FormRequest(url=link, formdata=self.form, cookies=self.cookie, callback=self.parse, dont_filter=True)
                else:
                    request = Request(url=link, cookies=self.cookie, callback=self.parse, dont_filter=True)
                yield request


    def element_parse(self, selectorElement, response, multiple, result, serialize=False):
        """元素选择器解析"""
        # 子选择器
        child_selectors = [i for i in self.selectors if i["parentSelectors"][0] == selectorElement["id"]]
        new_result = {}
        # 编辑根目录选择器
        for child_selector in child_selectors:
            # text类型选择器
            if child_selector["type"] == "SelectorText":
                text = self.text_resolve(child_selector, response)
                # 非多元素
                if text and not multiple:
                    text = [text[0]]
                # 正则过滤
                if child_selector["regex"]:
                    text = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in text]
                new_result[child_selector['id']] = text
            # image类型选择器
            elif child_selector["type"] == "SelectorImage":
                image = self.image_resolve(child_selector, response)
                # 非多元素
                if image and not multiple:
                    image = [image[0]]
                new_result[child_selector['id']] = image
            # attribute类型选择器
            elif child_selector["type"] == "SelectorElementAttribute":
                attribute = self.attribute_resolve(child_selector, response)
                # 非多元素
                if attribute and not multiple:
                    attribute = [attribute[0]]
                # 正则过滤
                if child_selector["regex"]:
                    attribute = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in attribute]
                new_result[child_selector['id']] = attribute
            # html类型选择器
            elif child_selector["type"] == "SelectorHTML":
                html = self.html_resolve(child_selector, response)
                # 非多元素
                if html and not multiple:
                    html = [html[0]]
                # 正则过滤
                if child_selector["regex"]:
                    html = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in html]
                new_result[child_selector['id']] = html

        detail_item = []
        if not serialize:
            result.update(new_result)
        else:
            result_mid = self.data_resolve(new_result)
            detail_item = [i.update(j) for i in result_mid for j in result]

        # element类型选择器
        element_selectors = [i for i in self.selectors if i["parentSelectors"][0] == selectorElement["id"] and i["type"]== "SelectorElement"]
        # detail类型选择器
        detail_selectors = [i for i in self.selectors if i["parentSelectors"][0] == selectorElement["id"] and i["type"] == "SelectorDetail"]
        if element_selectors:
            element_multiple = element_selectors[0]["type"]
            for elem in self.element_parse(element_selectors[0], response, element_multiple, result, serialize):
                yield elem
        elif detail_selectors:
            detail_urls = self.detail_resolve(detail_selectors[0], response, multiple)
            # 子选择器
            child_selectors = [i for i in self.selectors if i["parentSelectors"][0] == detail_selectors[0]["id"]]
            if not detail_urls or not child_selectors:
                # 数据集入库
                if not serialize:
                    result_items = self.data_resolve(result)
                    for result_item in result_items:
                        self.load_to_db(result_item)
                else:
                    for result_item in detail_item:
                        self.load_to_db(result_item)
            else:
                for elem in self.detail_parse(detail_selectors[0], detail_urls, child_selectors, result, response, serialize):
                    yield elem
        else:
            # 数据集入库
            if not serialize:
                result_items = self.data_resolve(result)
                for result_item in result_items:
                    self.load_to_db(result_item)
            else:
                for result_item in detail_item:
                    self.load_to_db(result_item)

    def detail_parse(self, selectorsDetail, detailUrls, childSelectors, result, response, serialize=False):
        """详情页处理"""
        if not serialize:
            # 数据序列化
            result_item = self.data_resolve(result)
            length_data = min(len(result_item), len(detailUrls))
            for i in range(length_data):
                yield Request(url=detailUrls[i], cookies=self.cookie, callback=self.detail_first,
                              meta={'result_item': result_item[i], 'childSelectors': childSelectors, 'selectorsDetail': selectorsDetail},
                              dont_filter=True)
        else:
            for i in detailUrls:
                yield Request(url=i, cookies=self.cookie, callback=self.detail_first,
                              meta={'result_item': result, 'childSelectors': childSelectors, 'selectorsDetail': selectorsDetail},
                              dont_filter=True)

    def get_detail(self, response):
        """解析详情页"""
        # 异步日志
        yield self.get_page_item(response)
        # 结果集
        result_item = response.meta['result_item']
        # 选择器
        selectorsDetail = response.meta['selectorsDetail']
        # 子选择器
        childSelectors = response.meta['childSelectors']
        # 判断响应结果
        if not isinstance(response, HtmlResponse):
            self.logger.info("non-HTML response is skipped: %s", response.url)
            return
        result = {}
        # 遍历子选择器
        for child_selector in childSelectors:
            # text类型选择器
            if child_selector["type"] == "SelectorText":
                text = self.text_resolve(child_selector, response)
                # 非多元素
                if text and not child_selector["multiple"]:
                    text = [text[0]]
                # 正则过滤
                if child_selector["regex"]:
                    text = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in text]
                result[child_selector['id']] = text
            # image类型选择器
            elif child_selector["type"] == "SelectorImage":
                image = self.image_resolve(child_selector, response)
                # 非多元素
                if image and not child_selector["multiple"]:
                    image = [image[0]]
                result[child_selector['id']] = image
            # attribute类型选择器
            elif child_selector["type"] == "SelectorElementAttribute":
                attribute = self.attribute_resolve(child_selector, response)
                # 非多元素
                if attribute and not child_selector["multiple"]:
                    attribute = [attribute[0]]
                # 正则过滤
                if child_selector["regex"]:
                    attribute = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in attribute]
                result[child_selector['id']] = attribute
            # html类型选择器
            elif child_selector["type"] == "SelectorHTML":
                html = self.html_resolve(child_selector, response)
                # 非多元素
                if html and not child_selector["multiple"]:
                    html = [html[0]]
                # 正则过滤
                if child_selector["regex"]:
                    html = [re.findall(child_selector["regex"], i)[0] if re.findall(child_selector["regex"], i) else "" for i in html]
                result[child_selector['id']] = html
        # 序列化
        result_mid = self.data_resolve(result)
        detail_item = []
        if isinstance(result_item, list):
            detail_item = [dict(i, **j) for i in result_item for j in result_mid]
        elif isinstance(result_item, dict):
            detail_item = [dict(result_item, **i) for i in result_mid]

        # element类型选择器
        element_selectors = [i for i in self.selectors if i["parentSelectors"][0] == selectorsDetail["id"] and i["type"]== "SelectorElement"]
        # detail类型选择器
        detail_selectors = [i for i in self.selectors if i["parentSelectors"][0] == selectorsDetail["id"] and i["type"] == "SelectorDetail"]
        if element_selectors:
            element_multiple = element_selectors[0]["type"]
            for elem in self.element_parse(element_selectors[0], response, element_multiple, detail_item, serialize=True):
                yield elem
        elif detail_selectors:
            detail_multiple = detail_selectors[0]["type"]
            detail_urls = self.detail_resolve(detail_selectors[0], response, detail_multiple)
            # 子选择器
            child_selectors = [i for i in self.selectors if i["parentSelectors"][0] == detail_selectors[0]["id"]]
            if not detail_urls or not child_selectors:
                # 数据集入库
                for result_item in detail_item:
                    self.load_to_db(result_item)
            else:
                for elem in self.detail_parse(detail_selectors[0], detail_urls, child_selectors, detail_item, response, serialize=True):
                    yield elem
        else:
            # 数据集入库
            for result_item in detail_item:
                self.load_to_db(result_item)

    def detail_resolve(self, selectorDetail, response, detail_multiple):
        """获取详情页url"""
        pages = response.css(selectorDetail["selector"] + "::attr(href)").extract()
        # 空值
        if not pages:
            return []
        result = []
        if not detail_multiple:
            pages = [pages[0]]
        for page in pages:
            page = page.strip()
            _, rest = urllib.parse.splittype(page)
            host, _ = urllib.parse.splithost(rest)
            if re.findall('^(?!http|javascript|//)/?\w.*?$', page, re.S | re.I) or page.startswith(
                    "."):
                if not host:
                    if page.startswith(".."):
                        page_url = page[2:]
                    elif page.startswith("."):
                        page_url = page[1:]
                    elif not page.startswith("/"):
                        page_url = "/" + page
                    else:
                        page_url = page
                    page = self.start_url[:self.start_url.index('//')] + '//' + self.domain + page_url
            result.append(page)
        return result

    def getParentsType(self, currentSelector):
        """获取所有父类选择器类型"""
        parent_type = []
        while currentSelector["parentSelectors"][0] != "_root":
            for i in self.selectors:
                if currentSelector["parentSelectors"][0] == i["id"]:
                    parent_type.append(i["type"])
                    currentSelector = i
                    break
        return parent_type

    def data_resolve(self, result):
        """数据集行列互换"""
        result_items = []
        name_item = []
        value_item = []
        for name, value in result.items():
            name_item.append(name)
            value_item.append(value)

        for data in zip_longest(*value_item, fillvalue=''):
            data_dict = {}
            for i, j in zip_longest(*[name_item, data], fillvalue=''):
                data_dict[i] = j
            result_items.append(data_dict)
        if not result_items:
            result_items = [{}]
        return result_items

    def text_resolve(self, selectorText, response):
        """文本类型解析"""
        text = response.css(selectorText["selector"]).extract()
        text = [re.sub('<.*?>', '', i) for i in text]
        text = [i.strip() for i in text]
        return text

    def image_resolve(self, selectorImage, response):
        """图片类型解析"""
        images = response.css(selectorImage["selector"] + "::attr(href)").extract()
        new_images = []
        # 替换完整路径
        for image in images:
            image = image.strip()
            _, rest = urllib.parse.splittype(images)
            host, _ = urllib.parse.splithost(rest)
            if re.findall('^(?!http|javascript|//)/?\w.*?$', image, re.S | re.I) or image.startswith(
                    "."):
                if not host:
                    if image.startswith(".."):
                        new_val = image[2:]
                    elif image.startswith("."):
                        new_val = image[1:]
                    elif not image.startswith("/"):
                        new_val = "/" + image
                    else:
                        new_val = image
                    image = self.start_url[:self.start_url.index('//')] + '//' + self.domain + new_val
            new_images.append(image)
        return new_images

    def attribute_resolve(self, selectorElementAttribute, response):
        """element属性类型解析"""
        attribute = response.css(selectorElementAttribute["selector"] + "::attr(%s)" % selectorElementAttribute["extractAttribute"]).extract()
        attribute = [i.strip() for i in attribute]
        return attribute

    def html_resolve(self, selectorHTML, response):
        """html类型解析"""
        html = response.css(selectorHTML["selector"]).extract()
        html = [i.strip() for i in html]
        return html

    def link_resolve(self, selectorLink, response):
        """翻页类型解析"""
        if selectorLink['pageUrl'] and isinstance(selectorLink['startNum'], int) and isinstance(selectorLink['endNum'], int):
            return [selectorLink['pageUrl'], int(selectorLink['startNum']), int(selectorLink['endNum'])]
        link = response.css(selectorLink["selector"] + "::attr(href)").extract()
        if not link:
            return ""
        link = link[0].strip()
        _, rest = urllib.parse.splittype(link)
        host, _ = urllib.parse.splithost(rest)
        if re.findall('^(?!http|javascript|//)/?\w.*?$', link, re.S | re.I) or link.startswith(
                "."):
            if not host:
                if link.startswith(".."):
                    new_val = link[2:]
                elif link.startswith("."):
                    new_val = link[1:]
                elif not link.startswith("/"):
                    new_val = "/" + link
                else:
                    new_val = link
                link = self.start_url[:self.start_url.index('//')] + '//' + self.domain + new_val
        return link

    def load_to_db(self, data):
        """存入数据库"""
        if not data:
            return
        load_fields = [i for i in data.keys()]
        fields = [i['id'] for i in self.selectors if i['type'] in ['SelectorText', 'SelectorElementAttribute', 'SelectorHTML', 'SelectorImage']]
        if not set(load_fields).difference(set(fields)):
            # 获取数据库对象
            db = self.mongo.get_db()
            collection_name = self.task_name
            collection = db[collection_name]
            result = self.mongo.exe_insert(collection, data)
            if not result['state']:
                logging.debug("load to db failed" + str(data))
