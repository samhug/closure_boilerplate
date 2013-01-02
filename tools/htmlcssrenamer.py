#! /usr/bin/env python
# encoding: utf-8

import json, html5lib, lxml.html
from waflib import *
from waflib.Configure import conf

class HtmlCssRenamer(object):
    
    def __init__(self, renaming_map, input_html):
        self.renaming_map = renaming_map
        self.input_html = input_html

    def _parse_class_list(self, buf):
        return buf.split()

    def process(self):
        doc = html5lib.parse(self.input_html, treebuilder='lxml', namespaceHTMLElements=False)

        for e in doc.iter():
            c_list_str = e.get('class')
            if c_list_str:
                class_list = self._parse_class_list(c_list_str)

                new_classes = []
                for c in class_list:
                    n_c = self.renaming_map.get(c)
                    if n_c:
                        new_classes.append(n_c)
                    else:
                        new_classes.append(c)

                e.set('class', ' '.join(new_classes))

        return lxml.html.tostring(doc)


def parse_renaming_map(buf):
    prefix = 'goog.setCssNameMapping('
    if buf.startswith(prefix):
        buf = buf[len(prefix):]

        # Remove ");" from end of string
        buf = buf[:-3]

    return json.loads(buf)


'''
def usage():
    print('htmlcssrenamer.py [renaming_map] [input_file] [output_file]')

if __name__ == '__main__':
    if len(sys.argv) != 4:
        usage()
        sys.exit(1)

    f_renaming_map = sys.argv[1]
    f_input = sys.argv[2]
    f_output = sys.argv[3]

    renaming_map = parse_renaming_map(open(f_renaming_map).read())
    
    input_html = open(f_input).read()

    print(renaming_map)

    output_html = HtmlCssRenamer(renaming_map, input_html).process()

    print(output_html)

    f = open(f_output, 'w')
    f.write(output_html)
    f.close()
'''


def options(ctx):
    pass

def configure(ctx):
    pass

class htmlcssrenamer_task(Task.Task):

    def __init__(self, inputs, renaming_map, target=None, *k, **kw):
        Task.Task.__init__(self, *k, **kw)

        self.renaming_map = renaming_map

        self.set_inputs(inputs or [])
        self.set_inputs(renaming_map)
        self.set_outputs(target)

    def run(self):

        renaming_map = parse_renaming_map(self.renaming_map.read())
        
        input_html = self.inputs[0].read()

        output_html = HtmlCssRenamer(renaming_map, input_html).process()

        self.outputs[0].write(output_html)

        return 0

@conf
def htmlcssrenamer(self, *k, **kw):
    kw['env'] = self.env
    tsk = htmlcssrenamer_task(*k, **kw)
    self.add_to_group(tsk)
    return tsk
