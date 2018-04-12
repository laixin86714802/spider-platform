# !/usr/bin/python
# -*- coding: utf-8 -*-

class Signal(object):
    def __init__(self, name, supports_defer):
        self.name = name
        self.supports_defer = supports_defer

    def __repr__(self):
        return "%s(%r, supports_defer=%r)" % (
            self.__class__.__name__, self.name, self.supports_defer
        )