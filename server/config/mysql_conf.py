# !/usr/bin/python
# -*- coding: utf-8 -*-

MYSQL_SERVER = {
    "write_db": {
        "version": 3,
        "objects": {
            "database": "crawl_db",
            "port": 3306,
            "host": "112.124.232.175",
            "user": "crawl_user",
            "maxConnections": 3,
            "minFreeConnections": 1,
            "charset": "utf8",
            "password": "Htctita331",
            "keepConnectionAlive": True
        }
    },
    "read_db": {
        "version": 3,
        "objects": {
            "database": "crawl_db",
            "port": 3306,
            "host": "112.124.232.175",
            "user": "crawl_user",
            "maxConnections": 3,
            "minFreeConnections": 1,
            "charset": "utf8",
            "password": "Htctita331",
            "keepConnectionAlive": True
        }
    },
    "admin_read_db": {
        "version": 1,
        "objects": {
            "database": "crawl_db",
            "port": 3306,
            "host": "112.124.232.175",
            "user": "crawl_user",
            "maxConnections": 3,
            "minFreeConnections": 1,
            "charset": "utf8",
            "password": "Htctita331",
            "keepConnectionAlive": True
        }
    },
    "admin_write_db": {
        "version": 1,
        "objects": {
            "database": "crawl_db",
            "port": 3306,
            "host": "112.124.232.175",
            "user": "crawl_user",
            "maxConnections": 3,
            "minFreeConnections": 1,
            "charset": "utf8",
            "password": "Htctita331",
            "keepConnectionAlive": True
        }
    },
    "msg_read_db": {
        "version": 2,
        "objects": {
            "database": "crawl_db",
            "port": 3306,
            "host": "112.124.232.175",
            "user": "crawl_user",
            "maxConnections": 3,
            "minFreeConnections": 1,
            "password": "Htctita331",
            "keepConnectionAlive": True
        }
    }
}
