import win32gui, time

t1 = time.time()
count = 0
dw = win32gui.GetDesktopWindow()
dc = win32gui.GetWindowDC(dw)
bm = win32gui.CreateCompatibleBitmap(dc)


for i in range(150):
  c = win32gui.GetPixel(dc, i, i)

t2 = time.time()
tf = t2-t1

print(str(tf) + "s")
