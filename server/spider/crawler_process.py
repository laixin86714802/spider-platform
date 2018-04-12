# !/usr/bin/python
# -*- coding: utf-8 -*-
import itertools, logging, six, operator
from scrapy.crawler import CrawlerProcess, Crawler
from scrapy.signalmanager import SignalManager
from scrapy import signals
from scrapy.core.downloader import Downloader
from scrapy.core.engine import ExecutionEngine
from scrapy.utils.reactor import CallLaterOnce

from server.spider.signals import Signal
from server.spider import stats
from server.spider.process_stats import ProcessStatsMonitor

# 日志
logger = logging.getLogger(__name__)

# spider信号stats改变时的信号
agg_stats_changed = Signal("agg_stats_changed", False)
STAT_SIGNALS = {
    stats.stats_changed: agg_stats_changed
}

# 新增信号状态
signals.spider_closing = object()
signals.engine_paused = object()
signals.engine_resumed = object()
signals.engine_tick = object()
signals.downloader_enqueued = object()
signals.downloader_dequeued = object()
# 信号状态参数
SCRAPY_SIGNAL_NAMES = [
    'engine_started',
    'engine_stopped',
    'engine_paused',  # custom
    'engine_resumed',  # custom
    'engine_tick',  # custom
    'item_scraped',
    'item_dropped',
    'spider_closed',
    'spider_closing',  # custom
    'spider_opened',
    'spider_idle',
    'spider_error',
    'request_scheduled',
    'request_dropped',
    'response_received',
    'response_downloaded',
    'downloader_enqueued',  # custom
    'downloader_dequeued',  # custom
]

def _get_crawler_process_signals_cls():
    """获取信号状态"""
    spider_to_cp = {}
    class CrawlerProcessSignals(object):
        @classmethod
        def signal(cls, spider_signal):
            return spider_to_cp[spider_signal]

        engine_started = Signal('engine_started', True)
        engine_stopped = Signal('engine_stopped', True)
        engine_paused = Signal('engine_paused', False)  # custom
        engine_resumed = Signal('engine_resumed', False)  # custom
        engine_tick = Signal('engine_tick', False)  # custom
        spider_opened = Signal('spider_opened', True)
        spider_idle = Signal('spider_idle', False)
        spider_closed = Signal('spider_closed', True)
        spider_closing = Signal('spider_closing', False)  # custom
        spider_error = Signal('spider_error', False)
        request_scheduled = Signal('request_scheduled', False)
        request_dropped = Signal('request_dropped', False)
        response_received = Signal('response_received', False)
        response_downloaded = Signal('response_downloaded', False)
        item_scraped = Signal('item_scraped', True)
        item_dropped = Signal('item_dropped', True)
        downloader_enqueued = Signal('downloader_enqueued', False)
        downloader_dequeued = Signal('downloader_dequeued', False)

    for name in SCRAPY_SIGNAL_NAMES:
        signal = getattr(signals, name)
        cp_signal = getattr(CrawlerProcessSignals, name)
        spider_to_cp[signal] = cp_signal

    return CrawlerProcessSignals

CrawlerProcessSignals = _get_crawler_process_signals_cls()

class MyselfExecutionEngine(ExecutionEngine):
    """扩写执行引擎 任务停止时发送信号"""
    def __init__(self, *args, **kwargs):
        super(MyselfExecutionEngine, self).__init__(*args, **kwargs)
        self.send_tick = CallLaterOnce(self._send_tick_signal)

    # TODO
    def close_spider(self, spider, reason='cancelled'):
        """关闭spider并清除未完成请求"""
        # self.slot使用twisted.reactor调度engine的_next_request方法, 核心循环方法
        if self.slot.closing:
            return self.slot.closing
        self.crawler.crawling = False
        self.signals.send_catch_log(signals.spider_closing)
        return super(MyselfExecutionEngine, self).close_spider(spider, reason)

    def pause(self):
        """暂停执行引擎"""
        super(MyselfExecutionEngine, self).pause()
        self.signals.send_catch_log(signals.engine_paused)

    def unpause(self):
        """继续执行暂停任务"""
        super(MyselfExecutionEngine, self).unpause()
        self.signals.send_catch_log(signals.engine_resumed)

    def _next_request(self, spider):
        """任务调度"""
        res = super(MyselfExecutionEngine, self)._next_request(spider)
        self.send_tick.schedule(0.1)
        return res

    def _send_tick_signal(self):
        """发送信号"""
        self.signals.send_catch_log_deferred(signals.engine_tick)

class MyselfCrawler(Crawler):
    """扩展Crawler"""
    def __init__(self, spidercls, settings=None, **kwargs):
        super(MyselfCrawler, self).__init__(spidercls, settings)
        self.url = kwargs.get('url', '')
        self.name = kwargs.get('name', '')
        self.method = kwargs.get('method', 'get')
        self.header = kwargs.get('header', {})
        self.form = kwargs.get('form', {})
        self.cookie = kwargs.get('cookie', {})
        self.selectors = kwargs.get('selectors', [])
        self.pageLoadDelay = kwargs.get('pageLoadDelay', 0)

    def _create_spider(self, *args, **kwargs):
        """创建spider"""
        return self.spidercls.from_crawler(self, *args, url=self.url, name=self.name, method=self.method,
                                           header=self.header, form=self.form, cookie=self.cookie,
                                           selectors=self.selectors, pageLoadDelay=self.pageLoadDelay, **kwargs)

    def _create_engine(self, *args, **kwargs):
        """创建engine"""
        return MyselfExecutionEngine(self, lambda _: self.stop())

class MyselfDownloader(Downloader):
    """下载器"""
    def _enqueue_request(self, request, spider):
        """队列中请求"""
        dfd = super(MyselfDownloader, self)._enqueue_request(request, spider)
        self.signals.send_catch_log(signals.downloader_enqueued)

        def _send_dequeued(_):
            """"""
            self.signals.send_catch_log(signals.downloader_dequeued)
            return _

        dfd.addBoth(_send_dequeued)
        return dfd

class MyselfCrawlerProcess(CrawlerProcess):
    """signals管理, spider管理"""
    crawl_ids = itertools.count(start=1)

    def __init__(self, settings=None):
        self.signals = SignalManager(self)
        self.signals.connect(self.on_spider_closed, CrawlerProcessSignals.spider_closed)
        self._finished_jobs = []
        self._paused_jobs = set()
        self.procmon = ProcessStatsMonitor()
        self.procmon.start()

        super(MyselfCrawlerProcess, self).__init__(settings or {})
        logging.getLogger('scrapy.spidermiddlewares.depth').setLevel(logging.INFO)

    def crawl(self, crawler_or_spidercls, *args, **kwargs):
        kwargs['crawl_id'] = next(self.crawl_ids)
        crawler = crawler_or_spidercls
        if not isinstance(crawler_or_spidercls, Crawler):
            crawler = self._create_crawler(crawler_or_spidercls)

        # 爬虫信号状态
        for name in SCRAPY_SIGNAL_NAMES:
            crawler.signals.connect(self._resend_signal, getattr(signals, name))

        if hasattr(crawler.stats, "signals"):
            crawler.stats.signals.connect(self._resend_signal, stats.stats_changed)

        d = super(MyselfCrawlerProcess, self).crawl(crawler_or_spidercls, *args, **kwargs)
        return d

    def _create_crawler(self, spidercls):
        """新建crawler"""
        if isinstance(spidercls, six.string_types):
            spidercls = self.spider_loader.load(spidercls)
        return MyselfCrawlerProcess(spidercls, self.settings)

    def stop_job(self, crawl_id):
        """crawl job停止信号"""
        self.get_crawler(crawl_id).stop()

    def pause_job(self, crawl_id):
        """crawl job暂停"""
        self._paused_jobs.add(crawl_id)
        self.get_crawler(crawl_id).engine.pause()

    def resume_job(self, crawl_id):
        """crawl job恢复"""
        self._paused_jobs.remove(crawl_id)
        self.get_crawler(crawl_id).engine.unpause()

    def get_crawler(self, crawl_id):
        """获取crawl"""
        for crawler in self.crawlers:
            if getattr(crawler.spider, "crawl_id") == crawl_id:
                return crawler
        raise  KeyError("Job is not known: %s" % crawl_id)

    def _resend_signal(self, **kwargs):
        # FIXME: signal and crawl are mess.
        signal = kwargs['signal']
        if signal in STAT_SIGNALS:
            signal = STAT_SIGNALS[signal]
            kwargs['crawler'] = kwargs.pop('sender').crawler
        else:
            signal = CrawlerProcessSignals.signal(signal)
            kwargs['crawler'] = kwargs.pop('sender')

        kwargs['signal'] = signal
        if signal.supports_defer:
            return self.signals.send_catch_log_deferred(**kwargs)
        else:
            return self.signals.send_catch_log(**kwargs)

    def stop(self):
        """停止crawl process"""
        self.procmon.stop()
        return super(MyselfCrawlerProcess, self).stop()

    def on_spider_closed(self, spider, reason):
        """spider关闭时写入"""
        self._finished_jobs.insert(0, {
            'id': spider.crawl_id,
            'job_id': getattr(spider, 'motor_job_id'),
            'seed': spider.domain,
            'status': reason,
            'stats': spider.crawler.stats.get_stats(spider),
            'downloads': self._downloader_stats(spider.crawler)
        })

    def get_jobs(self):
        """获取运行中的job"""
        crawlers = [crawler for crawler in self.crawlers if crawler.spider is not None]
        return [{
            'id': crawler.spider.crawl_id,
            'job_id': getattr(crawler.spider, 'motor_job_id'),
            'seed': crawler.spider.domain,
            'status': self._get_crawler_status(crawler),
            'stats': crawler.spider.crawler.stats.get_stats(crawler.spider),
            'downloads': self._downloader_stats(crawler)
        }for crawler in crawlers]

    @classmethod
    def _downloader_stats(cls, crawler):
        """下载器状态"""
        downloader = crawler.engine.downloader
        return {
            'active': [cls._request_info(req) for req in downloader.active],
            'slots': sorted([
                cls._slot_info(key, slot) for key, slot in downloader.slots.items()
            ], key=operator.itemgetter('key'))
        }

    @classmethod
    def _request_info(cls, request):
        """request消息"""
        return {
            'url': request.url,
            'method': request.method
        }

    @classmethod
    def _slot_info(cls, key, slot):
        """slot消息"""
        return {
            'key': key,
            'concurrency': slot.concurrency,
            'delay': slot.delay,
            'lastseen': slot.lastseen,
            'len(queue)': len(slot.queue),
            'transferring': [cls._request_info(req) for req in slot.transferring],
            'active': [cls._request_info(req) for req in slot.active]
        }

    def _get_crawler_status(self, crawler):
        """crawler运行状态"""
        if crawler.spider is None:
            return "unknown"
        if not crawler.crawling:
            return "stopping"
        if int(crawler.spider.crawl_id) in self._paused_jobs:
            return "suspended"
        return "crawling"

    @property
    def jobs(self):
        """完成和未完成crawl状态"""
        finished_ids = {job['id'] for job in self._finished_jobs}
        active_jobs = [job for job in self.get_jobs() if job['id'] not in finished_ids]

        return active_jobs + self._finished_jobs