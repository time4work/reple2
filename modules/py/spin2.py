import re
import random
from nltk.tokenize import regexp_tokenize
import nltk.data
from nltk.stem.porter import *

import language_check

class spinner( object ):
    def spin(self, s):
        while True:
            s, n = re.subn('{([^{}]*)}',
                        lambda m: random.choice(m.group(1).split("|")),
                        s)
            if n == 0: break
        return s.strip()
    
    def splitToSentences(self, content):
        tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')
        return tokenizer.tokenize(content)
    
    def getlib(self, lib):
        self.wordlib = lib
    def getSynonyms(self, word):
        synonyms = [word]
        syns = self.wordlib.match(word, all=True)
        if(syns == None):
            return 0, []
        for syn in syns:
            synonyms.append(syn)

        s = list(set(syns))
        return len(s), s

    def getSpintax(self, text):
        sentences = self.splitToSentences(text)
        stemmer = PorterStemmer()
        spintax = ""
        for sentence in sentences:
            tokens = regexp_tokenize(sentence, "[\w']+")
            for token in tokens:
                stem = stemmer.stem(token)
                n, syn = self.getSynonyms(stem)
                if(n == 0):
                    spintax += token+" "
                    continue
                spintax += "{"
                spintax += token
                spintax += "|"
                for x in range(n):
                    spintax += syn[x]
                    if x < n-1:
                        spintax += "|"
                    else:
                        spintax += "} "
        return spintax

#---------------------------------end of spinner class ---------------------------------#


class Magic:
    def __init__(self, nlib):
        self.lib = nlib

    def __call__(self, inp):
        s = spinner()
        s.getlib(self.lib)
        spintax = s.getSpintax(inp)
        spun = s.spin(spintax)
        tool = language_check.LanguageTool('en-US')
        text = spun
        matches = tool.check(text)
        result = language_check.correct(text, matches)
        return result

