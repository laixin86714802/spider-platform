# -*- coding: utf-8 -*-
"""
Async MongoDB item exporter using Motor_.

.. _Motor: https://github.com/mongodb/motor
"""
from __future__ import absolute_import
import logging
import datetime

from tornado import gen
from scrapy.exceptions import NotConfigured

from .utils import tt_coroutine, json_encode


logger = logging.getLogger(__name__)


class MotorPipeline(object):
    """
    This pipeline exports tems to MongoDB using async mongo
    driver (motor). Interaction with MongoDB doesn't block
    the event loop.

    On start it creates object in 'jobs' collection and sets
    spider.motor_job_id to the ID of this job.

    If MOTOR_PIPELINE_JOBID_KEY option is set, job id is added to
    each stored item under the specified key name.
    """
    ITEMS_COLLECTION = 'items'
    JOBS_COLLECTION = 'jobs'

    def __init__(self, crawler):
        try:
            import motor
        except ImportError:
            logger.info("MotorPipeline is disabled because motor Python package "
                        "is not available")
            raise NotConfigured

        self.crawler = crawler
        opts = self.crawler.settings
        if not opts.getbool('MOTOR_PIPELINE_ENABLED', False):
            raise NotConfigured

        self.job_id_key = opts.get('MOTOR_PIPELINE_JOBID_KEY')
        self.db_uri = opts.get('MOTOR_PIPELINE_URI', 'mongodb://localhost:27017')
        db_name = opts.get('MOTOR_PIPELINE_DB_NAME', 'motor_exporter')

        self.client = motor.MotorClient(self.db_uri)
        self.items_table = self.client[db_name][self.ITEMS_COLLECTION]
        self.jobs_table = self.client[db_name][self.JOBS_COLLECTION]
        self.connected = False

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    @tt_coroutine
    def open_spider(self, spider):
        try:
            yield self.items_table.ensure_index(self.job_id_key)

            self.job_id = yield self.jobs_table.insert({
                'started_at': datetime.datetime.now(),
                'spider': spider.name,
            })
            spider.motor_job_id = str(self.job_id)

            logger.info("Crawl job generated id: %s", self.job_id,
                        extra={'crawler': self.crawler})
            self.connected = True
        except Exception:
            self.job_id = None
            logger.error(
                "Can't connect to %s. Items won't be stored.",
                self.db_uri, exc_info=True,
                extra={'crawler': self.crawler},
            )

    @tt_coroutine
    def close_spider(self, spider):
        if self.job_id is None:
            self.client.close()
            return

        # json is to fix an issue with dots in key names
        stats = json_encode(self.crawler.stats.get_stats())

        res = yield self.jobs_table.update(
            {'_id': self.job_id},
            {'$set': {
                'finished_at': datetime.datetime.now(),
                'stats': stats,
            }}
        )
        self.client.close()
        logger.info("Job info %s is saved", self.job_id,
                    extra={'crawler': self.crawler})

    @tt_coroutine
    def process_item(self, item, spider):
        if not self.connected:
            raise gen.Return(item)

        mongo_item = dict(item)
        if self.job_id_key:
            mongo_item[self.job_id_key] = self.job_id

        try:
            yield self.items_table.insert(mongo_item)
            self.crawler.stats.inc_value("motor/items_stored_count")
        except Exception as e:
            self.crawler.stats.inc_value("motor/store_error_count")
            self.crawler.stats.inc_value("motor/store_error_count/" + e.__class__.__name__)
            logger.error("Error storing item", exc_info=True, extra={
                'crawler': self.crawler
            })
        raise gen.Return(item)
