---
icon: ffmpeg
---

# ffmpeg使用样例汇总

## 将图片合并为一个视频

将一堆jpg文件组成一个视频，每个jpg文件占据视频一秒钟：

```bash
ffmpeg -framerate 1 -i image%04d.jpg -vf "scale=1920:1080" -c:v libx264 -r 60 -pix_fmt yuv420p video2.mp4
```

## 合并两个视频，其中一个视频放到左上角，另一个视频居中

```bash
ffmpeg -i video1.mp4 -i video2.mp4 -filter_complex "[0:v]setpts=PTS-STARTPTS, minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=60'[fg]; [1:v]setpts=PTS-STARTPTS[bg]; [bg][fg]overlay=shortest=1" -c:v libx264 -crf 23 -preset veryfast -r 60 output.mp4
```

