# !/usr/bin/python
# -*- coding: utf-8 -*-

from scrapy.signalmanager import SignalManager
from tornado.ioloop import PeriodicCallback

import logging, psutil, os, time

logger = logging.getLogger(__name__)

class ProcessStatsMonitor(object):
    """查看进程状态, 每秒发布一次"""
    signal_updated = object()

    def __init__(self, interval=1.0):
        self.signals = SignalManager(self)
        self.process = psutil.Process(os.getpid())
        self.interval = interval
        self._task = PeriodicCallback(self._emit, self.interval*1000)
        self._recent = {}

    def start(self):
        """启动进程"""
        self._task.start()

    def stop(self):
        """停止进程"""
        self._task.stop()

    def get_recent(self):
        """当前进程信息"""
        return self._recent

    def _emit(self):
        """进程属性"""
        cpu_times = self.process.cpu_times()
        ram_usage = self.process.memory_info()
        stats = {
            # 内存使用率
            'ram_percent': self.process.memory_percent(),
            # 内存rss
            'ram_rss': ram_usage.rss,
            # 内存vms
            'ram_vms': ram_usage.vms,
            # cpu百分比
            'cpu_percent': self.process.cpu_percent(),
            # 用户cpu时间
            'cpu_time_user': cpu_times.user,
            # 系统cpu时间
            'cpu_time_system': cpu_times.system,
            # 上下文
            'context_switches': self.process.num_ctx_switches(),
            # 线程数
            'num_threads': self.process.num_threads(),
            # 运行时间
            'server_time': int(time.time() * 1000)
        }
        # 当前系统状态
        self._recent = stats
        self.signals.send_catch_log(self.signal_updated, stats=stats)