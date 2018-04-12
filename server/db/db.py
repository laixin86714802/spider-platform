# !/usr/bin/python
# -*- coding: utf-8 -*-
from pymongo import MongoClient

from server.config.opts import opts

class MongodbLink(object):
    """mongodb数据库操作类"""
    def __init__(self):
        self.conn = MongoClient(
            host=opts['spider.storage']['host'],
            port=opts['spider.storage']['port'],
            document_class=dict
        )

    def get_db(self):
        """获取数据库"""
        db = self.conn[opts['spider.storage']['db_name']]
        return db

    def get_config(self):
        """获取配置集合"""
        conf = self.conn[opts['spider.storage']['db_name']][opts['spider.storage']['config_collection']]
        return conf

    def exe_insert(self, collection, document):
        """插入数据"""
        try:
            result = collection.insert_one(document)
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': None}


    def exe_remove(self, collection, document):
        """删除数据"""
        try:
            result = collection.remove(document)
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': None}

    def exe_update(self, collection, document):
        """更新数据"""
        try:
            data = collection.update({"_id": document["_id"]}, document)
            result = collection.find_one({"_id": data["_id"]})
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': {}}

    def exe_search_one(self, collection, document):
        """查找一条数据"""
        try:
            result = collection.find_one(document)
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': {}}

    def exe_search(self, collection, document):
        """查找数据"""
        try:
            result = list(collection.find(document))
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': []}

    def exe_count(self, collection, document):
        """查询总数"""
        try:
            result = collection.find(document).count()
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': 0}

    def exe_search_page(self, collection, document, limit, offset):
        """翻页"""
        try:
            result = list(collection.find(document).limit(limit).skip(offset))
            return {'state': True, 'data': result}
        except:
            return {'state': False, 'data': []}