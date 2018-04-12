# !/usr/bin/python
# -*- coding: utf-8 -*-
import json
from tornado import web

class ApiHandler(web.RequestHandler):
    """handler JSON API"""
    def prepare(self):
        try:
            self.json_args = json.loads(self.request.body.decode() if isinstance(self.request.body, bytes) else self.request.body)
            # 检查参数
            assert self.json_args['selectedField'], 'KeyError'
            assert self.json_args['config'], 'KeyError'
            assert self.json_args['scrapeSitemap'], 'KeyError'
            self.is_json = True
        except:
            self.json_args = None
            self.is_json = False

class NoEtagsMixin(object):
    """从浏览器缓存中读取"""
    def compute_etag(self):
        return None
