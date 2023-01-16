---
icon: macos
---

# 为HHKB Professional 2映射R_Shift-ESC到波浪号

## 背景

对于HHKB Professional 2的键位不太适应:

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.1tnuakkl7zpc.jpg)

因此在Mac下用[Karabiner-Elements](https://karabiner-elements.pqrs.org/)进行重新映射。但其中有一点，我先把R_Shift+ESC映射为波浪号（Tilde），这时就需要用到[Karabiner-Elements](https://karabiner-elements.pqrs.org/)中的[Complex Modifications](https://karabiner-elements.pqrs.org/docs/manual/configuration/configure-complex-modifications/)功能了——也就是自己写映射规则了。

## 将R_Shift+ESC到波浪号（Tilde）

### 编写规则文件

我们先在`~/.config/karabiner/assets/complex_modifications`目录下新建一个JSON文件，文件名随便，内容大致如下：

````json
{
    "title": "remap r_shift+ecs to tilde rules",
    "rules": [
        {
            "description": "remap r_shift+ecs to tilde",
            "manipulators": [
                {
                    "type": "basic",
                    "from": {
                        "key_code": "escape",
                        "modifiers": {
                            "mandatory": "right_shift",
                            "optional": [
                                "any"
                            ]
                        }
                    },
                    "to": [
                        {
                            "key_code": "grave_accent_and_tilde",
                            "modifiers": [
                                "left_shift"
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
````

### 加载规则文件

打开[Karabiner-Elements](https://karabiner-elements.pqrs.org/)的配置，翻到[Complex Modifications](https://karabiner-elements.pqrs.org/docs/manual/configuration/configure-complex-modifications/)，点【Add rule】

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.1p0uh44rgkdc.jpg)

在【Rule】板块中**Enable**之前的规则：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.5knfmejg2n40.jpg)

这样就生效了：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.7256y26655c0.jpg)

## 发布自己的规则

在[Karabiner-Elements complex_modifications rules](https://ke-complex-modifications.pqrs.org/)提供了一些各位网友提供的映射规则，可以自己导入到[Karabiner-Elements](https://karabiner-elements.pqrs.org/)中。

另外一方面，你也可以将自己的规则发布到这个上面，只需Fork：[KE-complex_modifications](https://github.com/pqrs-org/KE-complex_modifications)。

## 参考

- [Mac键位修改神器- karabiner-elements](https://zhuanlan.zhihu.com/p/63340779)
- [Karabiner-Elements complex_modifications rules](https://ke-complex-modifications.pqrs.org/)

