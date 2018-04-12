# !/usr/bin/python
# -*- coding: utf-8 -*-

# 全局配置
opts = {
    'spider.storage': {'host': 'localhost', 'port': 27017, 'db_name': 'spider', 'config_collection': 'config'},
    'spider.scrapy': {'spider_packages': ''},
    'spider.manhole': {'host': 'localhost', 'port': '6023', 'enabled': False},
    'spider': {'host': '0.0.0.0', 'port': '9999', 'loglevel': 'DEBUG', 'reactor': 'auto', 'debug': True},
}