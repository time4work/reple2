import os
import sys
import spin2 as sp
from synonyms import load


if __name__ == '__main__':
    # print( os.getcwd() )
    # print os.path.basename(__file__)
    # print os.path.abspath(__file__)
    # print os.path.dirname(__file__)

    lib         = load(open( os.getcwd() + '/modules/py/syn.txt'))
    s           = sp.Magic(lib)
    text        = sys.stdin.readlines()

    print( s(text[0]) )