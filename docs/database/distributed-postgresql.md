---
icon: postgresql
---

# 集群版PostgreSQL

## 采用的组件

- [citus](https://www.citusdata.com/)：集群版PostgreSQL解决方案
- [pgpool-II](https://www.pgpool.net/mediawiki/index.php/Main_Page)：针对PostgreSQL的中间件，用于管理连接池、负载均衡等
- [docker](https://www.docker.com/)：我这里用docker部署，方便一点

## 部署架构

![](https://image-hosting.wuliang142857.me/20240902/集群版PostgreSQL.8l0123rmbl.jpg)

对应的IP（这样下面有所对照）：

| IP          | 主机名           | 组件                          |
| ----------- | ---------------- | ----------------------------- |
| 172.19.2.15 | hadoop-metal-001 | citus-coordinator / pgpool-II |
| 172.19.2.16 | hadoop-metal-002 | citus-worker1                 |
| 172.19.2.17 | hadoop-metal-003 | citus-worker2                 |

## 部署过程

### 初始化Swarm管理节点

```bash
docker swarm init --advertise-addr 172.19.2.15
```

这个命令将会创建一个Swarm集群，并将当前主机设置为管理节点。初始化成功后，它会输出一个加入集群的命令，该命令用于其他工作节点。

### 加入Swarm工作节点

在另外两台主机上，均执行刚才的输出的加入集群的命令：

```bash
docker swarm join --token SWMTKN-1-xxxxxxxxx 172.19.2.15:2377
```

### 创建overlay网络

```bash
docker network create -d overlay --attachable citus-overlay-network
```

### 验证网络和节点

```bash
# 查看网络
docker network ls

# 查看节点
docker node ls
```

### 部署配置

将在三台机器上创建相应的数据目录：

```bash
mkdir -pv /mnt/data_2/citus-data/{coordinator,worker1,worker2}
```



部署配置（deployment.yml）：

```yaml
version: '3.8'

services:
  citus-coordinator:
    image: citusdata/citus:latest
    environment:
      POSTGRES_PASSWORD: "123456"
    networks:
      - citus-overlay-network
    ports:
      - "5432:5432"
    volumes:
      - /mnt/data_2/citus-data/coordinator:/var/lib/postgresql/data  # 将数据目录挂载到卷
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  citus-worker1:
    image: citusdata/citus:latest
    environment:
      POSTGRES_PASSWORD: "123456"
    networks:
      - citus-overlay-network
    volumes:
      - /mnt/data_2/citus-data/worker1:/var/lib/postgresql/data  # 将数据目录挂载到卷
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == hadoop-metal-002  # 确保这是唯一的主机名

  citus-worker2:
    image: citusdata/citus:latest
    environment:
      POSTGRES_PASSWORD: "123456"
    networks:
      - citus-overlay-network
    volumes:
      - /mnt/data_2/citus-data/worker2:/var/lib/postgresql/data  # 将数据目录挂载到卷
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == hadoop-metal-003  # 确保这是唯一的主机名

  pgpool:
    image: bitnami/pgpool:latest
    environment:
      - PGPOOL_BACKEND_NODES=0:citus-coordinator:5432
      - PGPOOL_SR_CHECK_USER=postgres
      - PGPOOL_SR_CHECK_PASSWORD=123456
      - PGPOOL_ADMIN_USERNAME=admin  # 添加管理员用户名
      - PGPOOL_ADMIN_PASSWORD=123456  # 添加管理员密码
      - PGPOOL_POSTGRES_USERNAME=postgres  # 设置数据库管理员用户名
      - PGPOOL_POSTGRES_PASSWORD=123456  # 设置数据库管理员密码（与 Coordinator 的相同）
      - PGPOOL_PORT_NUMBER=9999
    networks:
      - citus-overlay-network
    ports:
      - "9999:9999"  # 默认 pgpool-II 端口
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

networks:
  citus-overlay-network:
    external: true
    
```

启动：

```bash
docker stack deploy -c deployment.yml citus-stack
```

停止：

```bash
docker stack rm citus-stack
```

### 注册工作节点

如果前面没有自己挂载数据目录的话，直接运行下面的`master_add_node`函数就行了。但如果挂载了数据目录，集群启动后，需要做一些修改：分别修改worker1和worker2对应的数据目录的`pg_hba.conf`文件，哪些允许/禁止规则都删除掉，只加2条：

```
local   all             postgres        	             	 trust
host    all             postgres        0.0.0.0/0            trust
```

然后:

```bash
docker exec -it <container_id> psql -U postgres
```

运行以重新加载配置：

```sql
SELECT pg_reload_conf();
```

添加计算节点：

```sql
SELECT master_add_node('citus-worker1', 5432);
SELECT master_add_node('citus-worker2', 5432);
```

验证集群：

```sql
SELECT * FROM master_get_active_worker_nodes();
```

### 创建分布式表来验证一下

```sql
CREATE TABLE users (id bigserial, name text, email text);

SELECT create_distributed_table('users', 'id');
```

查看分片和 Worker 节点的详细信息:

```sql
SELECT
    s.shardid,
    s.shardminvalue,
    s.shardmaxvalue,
    p.nodename,
    p.nodeport
FROM
    pg_dist_shard s
JOIN
    pg_dist_shard_placement p ON s.shardid = p.shardid
WHERE
    s.logicalrelid = 'users'::regclass;
```

## 使用TIP

### DB模板

在 Citus 集群中，每个数据库都是独立的，且每个数据库的分布式表和 Worker 节点配置也是独立的。这意味着在创建新的分布式数据库时，必须在所有 Worker 节点上创建相应的数据库。

因此，为了简化这个创建数据库的过程，可以创建一个数据库模板：

```sql
CREATE DATABASE template_citus;
\c template_citus
CREATE EXTENSION citus;
```

当需要创建新数据库时，使用 `template_citus` 作为模板：

```sql
CREATE DATABASE new_db TEMPLATE template_citus;
```

如果这个过程有说`template_citus`正在被使用，类似：ERROR:  source database "template_citus" is being accessed by other user，那么可以先终止和`template_citus`相关的任务：

```sql
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'template_citus' AND pid <> pg_backend_pid();
```

### 更简单的镜像

上述我们使用的是citus官方提供的镜像：`citusdata/citus:latest`，但我之所以要用集群版PostgreSQL，核心场景是用于[GeoServer](https://geoserver.org/)，其中主要用到的扩展用：[PostGIS](https://postgis.net/)和[pg_repack](https://reorg.github.io/pg_repack/)，因此研究一下干脆自定义一个镜像吧。过程比较简单，并且在此过程中，也学到了可以把模板数据库的创建放到初始脚本中。

Dockerfile参考：[https://github.com/postgis/docker-postgis/blob/master/16-3.4/Dockerfile](https://github.com/postgis/docker-postgis/blob/master/16-3.4/Dockerfile)，在此基于上修改了一下：

```dockerfile
FROM postgres:16-bullseye

LABEL maintainer="PostGIS Project - https://postgis.net" \
      org.opencontainers.image.description="PostGIS 3.4.2+dfsg-1.pgdg110+1 spatial database extension with PostgreSQL 16 bullseye" \
      org.opencontainers.image.source="https://github.com/postgis/docker-postgis"

ENV POSTGIS_MAJOR 3
ENV POSTGIS_VERSION 3.4.2+dfsg-1.pgdg110+1

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list \
      && apt update \
      && apt install -y curl \
      && apt-cache showpkg postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR \
      && apt install -y --no-install-recommends \
           ca-certificates \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR=$POSTGIS_VERSION \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR-scripts \
           postgresql-$PG_MAJOR-repack \
      && curl https://install.citusdata.com/community/deb.sh > /tmp/add-citus-repo.sh \
      && bash /tmp/add-citus-repo.sh \
      && apt -y install postgresql-16-citus-12.1 \
      && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /docker-entrypoint-initdb.d && echo 4
COPY ./initdb-postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh
COPY ./update-postgis.sh /usr/local/bin
```

对`initdb-postgis.sh`和`update-postgis.sh `中补充了`citus`的扩展：

```bash
#!/bin/bash

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# Create the 'template_postgis' template db
"${psql[@]}" <<- 'EOSQL'
CREATE DATABASE template_postgis IS_TEMPLATE true;
EOSQL

# Load PostGIS into both template_database and $POSTGRES_DB
for DB in template_postgis "$POSTGRES_DB"; do
	echo "Loading PostGIS extensions into $DB"
	"${psql[@]}" --dbname="$DB" <<-'EOSQL'
		CREATE EXTENSION IF NOT EXISTS postgis;
		CREATE EXTENSION IF NOT EXISTS postgis_topology;
		-- Reconnect to update pg_setting.resetval
		-- See https://github.com/postgis/docker-postgis/issues/288
		\c
		CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
		CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
		CREATE EXTENSION IF NOT EXISTS pg_repack;
		CREATE EXTENSION IF NOT EXISTS citus;
EOSQL
done
```

```bash
#!/bin/sh

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

POSTGIS_VERSION="${POSTGIS_VERSION%%+*}"

# Load PostGIS into both template_database and $POSTGRES_DB
for DB in template_postgis "$POSTGRES_DB" "${@}"; do
    echo "Updating PostGIS extensions '$DB' to $POSTGIS_VERSION"
    psql --dbname="$DB" -c "
        -- Upgrade PostGIS (includes raster)
        CREATE EXTENSION IF NOT EXISTS postgis VERSION '$POSTGIS_VERSION';
        ALTER EXTENSION postgis  UPDATE TO '$POSTGIS_VERSION';

        -- Upgrade Topology
        CREATE EXTENSION IF NOT EXISTS postgis_topology VERSION '$POSTGIS_VERSION';
        ALTER EXTENSION postgis_topology UPDATE TO '$POSTGIS_VERSION';

        -- Install Tiger dependencies in case not already installed
        CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
        -- Upgrade US Tiger Geocoder
        CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder VERSION '$POSTGIS_VERSION';
        ALTER EXTENSION postgis_tiger_geocoder UPDATE TO '$POSTGIS_VERSION';

        CREATE EXTENSION IF NOT EXISTS pg_repack;
        CREATE EXTENSION IF NOT EXISTS citus;
    "
done

```

因为citus需要再`postgresql.conf`中增加一行配置：

```ini
shared_preload_libraries = 'citus'
```

因此我们干脆自己重新准备一个干净的`custom-postgresql.conf`，比如：

```ini
shared_buffers = 8GB  # 根据系统内存调整
effective_cache_size = 12GB  # 根据系统内存调整
maintenance_work_mem = 1GB  # 根据需求调整
checkpoint_completion_target = 0.9
wal_buffers = 16MB  # 根据需求调整
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 32MB  # 根据需求调整
min_wal_size = 2GB
max_wal_size = 8GB
max_worker_processes = 256
max_parallel_workers_per_gather = 8
max_parallel_workers = 256
max_parallel_maintenance_workers = 8
max_connections = 512
password_encryption = md5
shared_preload_libraries = 'citus'
listen_addresses = '*'
log_timezone = 'Etc/UTC'
datestyle = 'iso, mdy'
timezone = 'Etc/UTC'
default_text_search_config = 'pg_catalog.english'
```

当然`pg_hba.conf`也可以准备一份新的，假设取名：`custom-hba.conf`：

```
local   all             postgres                              trust
host    all             postgres        0.0.0.0/0             trust
```

最终整个`deployment.yml`就是：

```yaml
version: '3.8'

services:
  citus-coordinator:
    image: harbor-dmz.yunzhen-data.com/ccc/postgis/postgis-citus:16-3.4
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "123456"
      PGDATA: /var/lib/postgresql/data/pgdata
    networks:
      - citus-overlay-network
    ports:
      - "5432:5432"
    volumes:
      - /mnt/data_2/citus-data/coordinator:/var/lib/postgresql/data  # 将数据目录挂载到卷
      - /root/Applications/citus/custom-postgresql.conf:/etc/postgresql/postgresql.conf
      - /root/Applications/citus/custom-hba.conf:/etc/postgresql/pg_hba.conf
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  citus-worker1:
    image: harbor-dmz.yunzhen-data.com/ccc/postgis/postgis-citus:16-3.4
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "123456"
      PGDATA: /var/lib/postgresql/data/pgdata
    networks:
      - citus-overlay-network
    ports:
      - "15432:5432"
    volumes:
      - /mnt/data_2/citus-data/worker:/var/lib/postgresql/data  # 将数据目录挂载到卷
      - /root/Applications/citus/custom-postgresql.conf:/etc/postgresql/postgresql.conf
      - /root/Applications/citus/custom-hba.conf:/etc/postgresql/pg_hba.conf
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == hadoop-metal-002  # 确保这是唯一的主机名

  citus-worker2:
    image: harbor-dmz.yunzhen-data.com/ccc/postgis/postgis-citus:16-3.4
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: "123456"
      PGDATA: /var/lib/postgresql/data/pgdata
    networks:
      - citus-overlay-network
    ports:
      - "25432:5432"
    volumes:
      - /mnt/data_3/citus-data/worker:/var/lib/postgresql/data  # 将数据目录挂载到卷
      - /root/Applications/citus/custom-postgresql.conf:/etc/postgresql/postgresql.conf
      - /root/Applications/citus/custom-hba.conf:/etc/postgresql/pg_hba.conf
    command: ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf", "-c", "hba_file=/etc/postgresql/pg_hba.conf"]
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == hadoop-metal-003  # 确保这是唯一的主机名

  pgpool:
    image: mirrors.yz-core.com/docker.io/bitnami/pgpool:latest
    environment:
      - PGPOOL_BACKEND_NODES=0:citus-coordinator:5432
      - PGPOOL_SR_CHECK_USER=postgres
      - PGPOOL_SR_CHECK_PASSWORD=123456
      - PGPOOL_ADMIN_USERNAME=admin  # 添加管理员用户名
      - PGPOOL_ADMIN_PASSWORD=123456  # 添加管理员密码
      - PGPOOL_POSTGRES_USERNAME=postgres  # 设置数据库管理员用户名
      - PGPOOL_POSTGRES_PASSWORD=123456  # 设置数据库管理员密码（与 Coordinator 的相同）
      - PGPOOL_PORT_NUMBER=9999
    networks:
      - citus-overlay-network
    ports:
      - "9999:9999"  # 默认 pgpool-II 端口
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

networks:
  citus-overlay-network:
    external: true
```

这个这样就简单了很多。



### 如何查看一个schema下的所有表哪些是分布式表，哪些不是分布式表

```sql
SELECT 
    t.table_schema, 
    t.table_name, 
    CASE 
        WHEN p.logicalrelid IS NOT NULL THEN 'Distributed' 
        ELSE 'Not Distributed' 
    END AS distribution_status
FROM 
    information_schema.tables t
LEFT JOIN 
    pg_dist_partition p 
ON 
    t.table_schema || '.' || t.table_name = p.logicalrelid::regclass::text
WHERE 
    t.table_schema = 'your_schema_name'  -- 替换为您的schema名称
    AND t.table_type = 'BASE TABLE';
```

确保一个schema下的所有表都是分布式表：

```sql
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- 获取指定 schema 下的所有表
    FOR rec IN
        SELECT t.table_schema, t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'your_schema' 
        AND t.table_type = 'BASE TABLE'
    LOOP
        -- 检查每个表是否是分布式表
        IF NOT EXISTS (
            SELECT 1
            FROM pg_dist_partition
            WHERE logicalrelid = (rec.table_schema || '.' || rec.table_name)::regclass
        ) THEN
            -- 检查表中是否存在 osm_id 字段
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = rec.table_schema
                AND table_name = rec.table_name
                AND column_name = 'osm_id'
            ) THEN
                -- 如果存在 osm_id 字段，转换为分布式表
                RAISE NOTICE 'Converting table % to distributed with distribution key: osm_id', rec.table_schema || '.' || rec.table_name;
                EXECUTE 'SELECT create_distributed_table(''' || rec.table_schema || '.' || rec.table_name || ''', ''osm_id'');';
            ELSE
                -- 如果表中不存在 osm_id 字段，跳过
                RAISE NOTICE 'Table % does not have an osm_id column, skipping.', rec.table_schema || '.' || rec.table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table % is already a distributed table, skipping.', rec.table_schema || '.' || rec.table_name;
        END IF;
    END LOOP;
END $$;
```

