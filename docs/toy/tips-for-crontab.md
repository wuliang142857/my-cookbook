---
icon: crontab
---

# Crontab小技巧汇总

## 计划任务的备份和恢复

备份：

```bash
crontab -l > ~/crontab_backup
```

恢复：

```bash
crontab ~/crontab_backup
```

## 清空所有计划任务

```bash
crontab -r
```

