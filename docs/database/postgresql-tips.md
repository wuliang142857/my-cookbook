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

## 对某个schema下的所有表执行truncate

```sql
DO $$
DECLARE
    rec record;
BEGIN
    FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'your_schema'
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident('your_schema') || '.' || quote_ident(rec.tablename) || ' CASCADE;';
    END LOOP;
END $$;
```



## 查看某个schema下的所有表的创建索引的语句

```sql
SELECT indexname AS index_name,
       tablename AS table_name,
       indexdef AS create_index_statement
FROM pg_indexes
WHERE schemaname = 'your_schema';
```

### 删除某个schema下所有表的索引

```sql
DO $$
DECLARE
    index_name RECORD;
BEGIN
    -- 遍历所有属于指定 schema 的索引
    FOR index_name IN 
        SELECT indexname, schemaname, tablename
        FROM pg_indexes
        WHERE schemaname = 'import'
    LOOP
        BEGIN
            -- 尝试直接删除索引
            EXECUTE format('DROP INDEX IF EXISTS %I.%I;', index_name.schemaname, index_name.indexname);
        EXCEPTION WHEN others THEN
            -- 如果直接删除索引失败，检查是否是主键或唯一约束
            IF EXISTS (SELECT 1 FROM pg_constraint 
                       WHERE conname = index_name.indexname 
                         AND conrelid = (quote_ident(index_name.schemaname) || '.' || quote_ident(index_name.tablename))::regclass) THEN
                -- 删除约束
                EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I;', index_name.schemaname, index_name.tablename, index_name.indexname);
                -- 删除索引
                EXECUTE format('DROP INDEX IF EXISTS %I.%I;', index_name.schemaname, index_name.indexname);
            ELSE
                RAISE NOTICE '无法删除索引：%', index_name.indexname;
            END IF;
        END;
    END LOOP;
END $$;

```

## 查看一个schema下所有表的行数

```sql
SELECT
    table_schema,
    table_name,
    n_live_tup AS row_count
FROM
    information_schema.tables AS t
JOIN
    pg_stat_user_tables AS st
ON
    t.table_schema = st.schemaname
AND
    t.table_name = st.relname
WHERE
    t.table_schema = 'import'  -- 替换为你的schema名称
ORDER BY
    row_count DESC;
```

