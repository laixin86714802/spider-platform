# !/usr/bin/python
# -*- coding: utf-8 -*-

import logging

import tornado.platform.twisted
from server import __version__
from tornado.ioloop import IOLoop

from server.config.opts import opts

# 日志
logger = logging.getLogger('spider')

def setup_event_loop(use_twisted_reactor, debug=True):
    """启动event_loop"""
    if use_twisted_reactor:
        tornado.platform.twisted.TwistedIOLoop().install()
        if debug:
            print("Using Twisted reactor as a Tornado event loop")
    else:
        tornado.platform.twisted.install()
        IOLoop.instance().set_blocking_log_threshold(0.5)
        if debug:
            print("Using Tornado event loop as a Twisted reactor")

def main(port, host, start_manhole, manhole_port, manhole_host, loglevel, opts):
    """主函数"""
    from server.spider.handlers import get_application
    from server.spider.crawler_process import MyselfCrawlerProcess
    from server.spider import manhole
    # 日志等级
    settings = {'LOG_LEVEL': loglevel}
    crawler_process = MyselfCrawlerProcess(settings)

    app = get_application(crawler_process, opts)
    app.listen(int(port), host)
    logger.info("scrapy v%s is started on %s:%s" % (__version__, host, port))

    if start_manhole:
        manhole.start(manhole_port, manhole_host, {'cp': crawler_process})
        logger.info("Manhole server is started on %s:%s" % (manhole_host, manhole_port))

    crawler_process.start(stop_after_crawl=False)


if __name__ == '__main__':
    setup_event_loop(
        use_twisted_reactor=False,
        debug=False
    )

    main(
        port=int(opts['spider']['port']),
        host=opts['spider']['host'],
        start_manhole=opts['spider.manhole']['enabled'],
        manhole_port=int(opts['spider.manhole']['port']),
        manhole_host=opts['spider.manhole']['host'],
        loglevel=opts['spider']['loglevel'],
        opts=opts,
    )