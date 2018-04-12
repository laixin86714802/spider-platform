# !/usr/bin/python
# -*- coding: utf-8 -*-

import logging, json
from tornado import websocket
from server.config.utils import json_encode

logger = logging.getLogger(__name__)

class BaseWSHandler(websocket.WebSocketHandler):
    """websocket通信基类，数据类型{"event": name, "data": data}"""
    def write_event(self, event, data):
        """向客户端发送message"""
        message = json_encode({'event': event, 'data': data})
        self.write_message(message)

    def on_message(self, message):
        try:
            msg = json.loads(message)
            event, data = msg['event'], msg['data']
        except Exception as e:
            logger.warning("Invalid message skipped" + message[:500])
            return
        self.on_event(event, data)

    def on_event(self, event, data):
        """客户端接收消息"""
        pass

    def on_open(self, *args, **kwargs):
        pass

    def open(self, *args, **kwargs):
        self.on_open(*args, **kwargs)