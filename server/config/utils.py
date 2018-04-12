# !/usr/bin/python
# -*- coding: utf-8 -*-

from scrapy.utils.serialize import ScrapyJSONEncoder

def json_encode(obj):
    """转换json对象"""
    _encoder = ScrapyJSONEncoder(ensure_ascii=False)
    return _encoder.encode(obj)