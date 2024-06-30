---
icon: postgresql
---

# PostgreSQL Tips

## 按字段对某个表或者分区进行快速去重

下面这条SQL贼快，比`min(id)`或者加时间窗口函数：`rank()`等都很多很多：

```sql
DO $$
BEGIN
    -- 创建临时表，并设置其在事务提交后自动删除
    EXECUTE format('
        CREATE TEMP TABLE tmp_keep ON COMMIT DROP AS 
        SELECT DISTINCT ON (longitude, latitude) *
        FROM reverse_geocoding_caches
        ORDER BY longitude, latitude, id
    ');

    -- 清空原表数据
    EXECUTE 'TRUNCATE TABLE reverse_geocoding_caches';

    -- 将数据从临时表移回原表
    EXECUTE 'INSERT INTO reverse_geocoding_caches SELECT * FROM tmp_keep';
   
   EXECUTE 'DROP TABLE tmp_keep';
END $$;

```

如果是要对一个表下的所有分区都进行去重：

```sql
DO $$
DECLARE
    partition text;
BEGIN
    FOR partition IN
        SELECT inhrelid::regclass::text
        FROM pg_inherits
        WHERE inhparent = 'bingmap.reverse_geocoding_caches'::regclass
    LOOP
        -- 使用EXECUTE和format执行动态SQL，注意内部SQL要用单引号包裹，且内部的单引号需要双写
        EXECUTE format('CREATE TEMP TABLE tmp_keep ON COMMIT DROP AS SELECT DISTINCT ON (longitude, latitude) * FROM %I ORDER BY longitude, latitude, id', partition);
        
        EXECUTE format('TRUNCATE TABLE %I', partition);
        
        EXECUTE format('INSERT INTO %I SELECT * FROM tmp_keep', partition);
        
        EXECUTE 'DROP TABLE tmp_keep';
    END LOOP;
END $$;

```



