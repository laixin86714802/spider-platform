# !/usr/bin/python
# -*- coding: utf-8 -*-
import multiprocessing

from scrapy.crawler import CrawlerProcess, Crawler

def thread_crawl(url, spider_cls, method, header, cookie, form, settings):
    """多进程同步"""
    scrapy_thread = multiprocessing.Process(
        target=crawl,
        args=(url, spider_cls, method, header, cookie, form, settings)
    )
    scrapy_thread.start()
    # 等待完成
    scrapy_thread.join()
    return True

def crawl(url, spider_cls, method, header, cookie, form, settings):
    """启动spider"""
    crawler_process = CrawlerProcess()
    crawler = create_crawler(settings, spider_cls=spider_cls, url=url, method=method, header=header, form=form, cookie=cookie)
    crawler_process.crawl(crawler)
    crawler_process.start()
    return True

DEFAULT_SETTINGS = {
    'ROBOTSTXT_OBEY': False,
    'DEPTH_STATS_VERBOSE': True,
    'BOT_NAME': 'spider_platform',
    'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2148.0 Safari/537.36',
    'LOG_LEVEL': 'DEBUG',
    'TELNETCONSOLE_ENABLED': False,
    # 超时时间
    'DOWNLOAD_TIMEOUT': 30
}

def create_crawler(settings=None, spider_cls=None, **kwargs):
    """生成crawler类"""
    _settings = DEFAULT_SETTINGS.copy()
    _settings.update(settings or {})
    return IndexCrawler(spider_cls, _settings, **kwargs)

class IndexCrawler(Crawler):
    """扩展Crawler"""
    def __init__(self, spidercls, settings=None, **kwargs):
        super(IndexCrawler, self).__init__(spidercls, settings)
        self.url = kwargs.get('url', '')
        self.method = kwargs.get('method', 'get')
        self.header = kwargs.get('header', {})
        self.form = kwargs.get('form', {})
        self.cookie = kwargs.get('cookie', {})

    def _create_spider(self, *args, **kwargs):
        """创建spider"""
        return self.spidercls.from_crawler(self, *args, url=self.url, method=self.method, header=self.header, form=self.form, cookie=self.cookie, **kwargs)
