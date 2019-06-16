import os
import sys
import shutil

if len(sys.argv) != 2:
    raise "Syntax is 'import_images.py [main folder name]"

def fn_to_int(fn):
    return int(fn.split('.')[0])
k = fn_to_int(
        max(
            max(os.listdir("labeled"), key=fn_to_int), 
            max(os.listdir("unlabeled"), key=fn_to_int)
            )
        ) + 1
for f in os.listdir(sys.argv[1]):
    for img_fn in os.listdir(os.path.join(sys.argv[1], f)):
        if img_fn.split('.')[-1] not in ['jpg', 'jpeg', 'png']:
            continue
        print(img_fn)
        full_fn = os.path.join(sys.argv[1], f, img_fn)
        shutil.copy(full_fn, "unlabeled/{}.jpg".format(k))
        k += 1
