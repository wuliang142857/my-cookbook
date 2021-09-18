# 如何更改Mac默认的截图文件名和存储路径
## 更改默认的存储路径

Mac默认的截屏（`command+shift+4`）是将图片保存在桌面的，对于我这种桌面一尘不染的人简直是一种羞辱，必须改掉：

````bash
defaults write com.apple.screencapture location ~/Pictures
killall SystemUIServer
````

## 修改默认文件名

我用的是中文界面的Mac，默认截屏的文件名是“截屏”，对于我这种命令行控也是一种负担：

````bash
defaults write com.apple.screencapture name "Screenshot"
killall SystemUIServer
````

## 去掉窗口截图的阴影

````bash
defaults write com.apple.screencapture disable-shadow -bool true
killall SystemUIServer
````

## 参考：

- [更改Mac默认的截图名称格式及路径](https://blog.csdn.net/caiqiiqi/article/details/83247462)