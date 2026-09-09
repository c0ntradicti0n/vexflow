#!/usr/bin/python
# usage
# ./convert.py <source> <dest>
#
# convert font formats based on file extension (i.e.: convert Gonville.otf Govillle.woff2)
#

import math
from sys import argv

import fontforge
import psMat

f = fontforge.open(argv[1])
f.generate(argv[2])
