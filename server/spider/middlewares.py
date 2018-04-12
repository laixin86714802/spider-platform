# -*- coding: utf-8 -*-

# Define here the models for your spider middleware
#
# See documentation in:
# http://doc.scrapy.org/en/latest/topics/spider-middleware.html

# from scrapy import signals
from selenium import webdriver
from scrapy.http import HtmlResponse
import base64

#指定使用的浏览器，写在此处而不写在类中，是为了不每次调用都生成一个信息独享，减少内存使用
# global driver
# driver = webdriver.PhantomJS()

class PhantomJSMiddleware(object):
    """动态解析js"""
    @classmethod
    def process_request(cls, request, spider):
        # 开启动态加载
        # global driver
        driver = webdriver.PhantomJS(executable_path=r'D:\phantomjs-2.1.1\bin\phantomjs')
        driver.get(request.url)
        # # 滚动页面
        # driver.execute_script(js)
        # # 等待JS执行
        # time.sleep(1)
        # 编码
        content = driver.page_source.encode('utf-8', 'ignore')
        driver.quit()
        return HtmlResponse(request.url, encoding='utf-8', body=content, status=200)

class ProxyIPMiddleware(object):
    """代理ip"""
    def process_request(self, request, spider):
        """代理ip"""
        request.meta['proxy'] = "http://proxy.abuyun.com:9020"
        proxy_user_pass = "H1IF096FYI74C29D:10F8046B21581DBA"
        encoded_user_pass = base64.b64encode(proxy_user_pass.encode()).decode()
        request.headers['Proxy-Authorization'] = 'Basic ' + encoded_user_pass