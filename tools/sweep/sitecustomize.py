"""Take 150, the date sweep: Python's clock moved by SMOKE_OFFSET_S seconds, for the helpers the smoke calls (hunt.py
--from-fixtures stamps "now" into the feed it writes). Loaded only when tools/sweep/ is on PYTHONPATH, which the smoke
runner sets under SMOKE_NOW; nothing else reads this file."""
import os
import time

_off = float(os.environ.get("SMOKE_OFFSET_S") or 0)
if _off:
    _time, _gm, _lt, _sf = time.time, time.gmtime, time.localtime, time.strftime
    time.time = lambda: _time() + _off
    time.gmtime = lambda s=None: _gm(time.time() if s is None else s)
    time.localtime = lambda s=None: _lt(time.time() if s is None else s)
    time.strftime = lambda f, t=None: _sf(f, time.localtime() if t is None else t)
    import datetime as _d

    class _DateTime(_d.datetime):
        @classmethod
        def now(cls, tz=None):
            return cls.fromtimestamp(time.time(), tz)

        @classmethod
        def utcnow(cls):
            return cls.utcfromtimestamp(time.time())

    class _Date(_d.date):
        @classmethod
        def today(cls):
            return cls.fromtimestamp(time.time())

    _d.datetime, _d.date = _DateTime, _Date
