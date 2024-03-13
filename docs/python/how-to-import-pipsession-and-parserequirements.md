---
icon: python
---

# 如何import PipSession和parse_requirements

在我们写`setup.py`中，我们希望`setup.py`能和 `requirement.txt`共用一份依赖配置，那么我们的思路自然是将`requirement.txt`的内容解析出来，加入到`setup.py`中的`install_requires`中。

对于`requirements.txt`的解析，`pip`中提供了`parse_requirements`方法。

`parse_requirements`的函数原型：

````python
parse_requirements(filename: str, session: pip._internal.network.session.PipSession, finder: Optional[ForwardRef('PackageFinder')] = None, options: Optional[optparse.Values] = None, constraint: bool = False) -> Iterator[pip._internal.req.req_file.ParsedRequirement]
````

也就是它至少需要传入`requirement.txt`文件路径和`PipSession`两个参数。

不过比较坑的是，不同版本的`pip`import`parse_requirements`和`PipSession`的路径不一样。

目前可以这样做最大兼容：

````python
try:
    # pip >=20
    from pip._internal.network.session import PipSession
    from pip._internal.req import parse_requirements
except ImportError:
    try:
        # 10.0.0 <= pip <= 19.3.1
        from pip._internal.download import PipSession
        from pip._internal.req import parse_requirements
    except ImportError:
        # pip <= 9.0.3
        from pip.download import PipSession
        from pip.req import parse_requirements
````

对`requirements.txt`文件的解析方法也需要做一定的兼容：

````python
here = os.path.dirname(__file__)
# parse_requirements() returns generator of pip.req.InstallRequirement objects
if os.path.exists(os.path.join(here, "requirements.txt")):
    install_reqs = parse_requirements(os.path.join(here, "requirements.txt"), session=PipSession())
else:
    install_reqs = []
requirements = list() 
try:
    requirements = [str(ir.req) for ir in install_reqs]
except:
    requirements = [str(ir.requirement) for ir in install_reqs]
````

