import win32gui, win32ui, time

# w = win32ui.GetMainFrame()
dw = win32gui.GetDesktopWindow()
w = win32ui.CreateWindowFromHandle(dw)
t1 = time.time()
count = 0
while count < 1000:
    dc = w.GetWindowDC()
    dc.GetPixel (60,20)
    dc.DeleteDC()
    count +=1
t2 = time.time()
tf = t2-t1
it_per_sec = int(count/tf)
print (str(it_per_sec) + " iterations per second")